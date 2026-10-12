const { execSync } = require('child_process');
const { toHTML } = require('@portabletext/to-html');
const imageUrlBuilderPkg = require('@sanity/image-url');

// Safely handle CJS / ESM export interop
const imageUrlBuilder = imageUrlBuilderPkg.default || imageUrlBuilderPkg;

// Configure the Sanity image builder
const builder = imageUrlBuilder({
  projectId: process.env.SANITY_PROJECT_ID || 'f7bqs4ud',
  dataset: process.env.SANITY_DATASET || 'production'
});

module.exports = function(eleventyConfig) {
  // Pass the whole assets folder through
  eleventyConfig.addPassthroughCopy("src/assets");

  // Completely ignore the partials folder so Eleventy doesn't compile them
  eleventyConfig.ignores.add("src/assets/partials/**");

  // Portable text filter
  // Components for block types the default renderer does not know. Without an "image" component the
  // renderer printed a hidden <div> "Unknown block type "image"..." into the page, which Pagefind then
  // indexed and showed in search results (and inline images never appeared in the story).
  const escAttr = (v) => String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const portableTextComponents = {
    types: {
      // Inline image inside the story body. Uses the same Sanity builder as sanityImageUrl,
      // so hotspot / crop set in the Studio are respected.
      image: ({ value }) => {
        if (!value || !value.asset) return "";
        const src = builder.image(value).width(1200).quality(80).auto("format").url();
        const caption = value.caption ? `<figcaption>${escAttr(value.caption)}</figcaption>` : "";
        // data-pagefind-ignore: captions never show up in search results
        return `<figure class="article-inline-figure" data-pagefind-ignore style="margin: 1.5rem 0;">` +
               `<img src="${src}" alt="${escAttr(value.alt)}" loading="lazy" style="max-width: 100%; height: auto;">` +
               `${caption}</figure>`;
      }
    },
    // Any other unknown block type renders nothing (never a visible or hidden warning text in the page).
    unknownType: () => ""
  };

  eleventyConfig.addFilter("portableText", function(value) {
    return value ? toHTML(value, { components: portableTextComponents }) : "";
  });

  // Sanity Image CDN Filter
  eleventyConfig.addFilter("sanityImageUrl", function(imageSource, width = 800, quality = 80) {
    if (!imageSource) return "";
    return builder
      .image(imageSource)
      .width(width)
      .quality(quality)
      .auto('format') 
      .url();
  });

  // Rebuild the Pagefind search index after every Eleventy build, so
  // `npm run dev` has working search without running `build` first.
  eleventyConfig.on("eleventy.after", ({ dir }) => {
    execSync(`npx pagefind --site ${dir.output}`, { stdio: "inherit" });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};