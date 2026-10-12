import {useCallback, useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Button, Card, Checkbox, Flex, Select, Stack, Text} from '@sanity/ui'

const TYPES = ['article', 'author'] // delete articles first, then authors

type Doc = {_id: string; label: string}

export function BulkDeleteTool() {
  const client = useClient({apiVersion: '2024-01-01', perspective: 'raw'})
  const [type, setType] = useState(TYPES[0])
  const [docs, setDocs] = useState<Doc[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    const result = await client.fetch<Doc[]>(
      `*[_type == $type]{_id, "label": coalesce(title_ar, title_en, name_en, name_ar, title, name, _id)} | order(_createdAt desc)`,
      {type}
    )
    setDocs(result)
    setSelected([])
  }, [client, type])

  useEffect(() => {
    load()
  }, [load])

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const allSelected = docs.length > 0 && selected.length === docs.length

  const remove = async () => {
    if (!window.confirm(`Permanently delete ${selected.length} document(s)?`)) return
    try {
      const tx = client.transaction()
      selected.forEach((id) => tx.delete(id))
      await tx.commit()
      setStatus(`Deleted ${selected.length} document(s).`)
    } catch (e: any) {
      setStatus(`Error: ${e.message}`)
    }
    load()
  }

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Select value={type} onChange={(e) => setType(e.currentTarget.value)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>

        <Flex align="center" gap={3}>
          <Checkbox
            checked={allSelected}
            onChange={() => setSelected(allSelected ? [] : docs.map((d) => d._id))}
          />
          <Text weight="semibold">Select all ({docs.length})</Text>
        </Flex>

        {docs.map((d) => (
          <Flex key={d._id} align="center" gap={3}>
            <Checkbox checked={selected.includes(d._id)} onChange={() => toggle(d._id)} />
            <Text>
              {d.label}
              {d._id.startsWith('drafts.') && (
                <span style={{opacity: 0.5}}> (draft)</span>
              )}
            </Text>
          </Flex>
        ))}

        <Button
          tone="critical"
          text={`Delete selected (${selected.length})`}
          disabled={selected.length === 0}
          onClick={remove}
        />
        {status && <Text size={1}>{status}</Text>}
      </Stack>
    </Card>
  )
}