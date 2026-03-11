import { useState } from 'react'
import { useMutation} from '@tanstack/react-query'
import { Plus, Pencil, Trash2, CheckCircle2, Circle, PlayCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {  selectStory } from '@/api/stories'
import type { ParticipantResponse, StoryResponse } from '@/types'
import { useCreateStory } from '@/hooks/story/use-create-story'
import { useUpdateStory } from '@/hooks/story/use-update-story'
import { useDeleteStory } from '@/hooks/story/use-delete-story'


interface Props {
  stories: StoryResponse[]
  me: ParticipantResponse
  roomId: string
  currentStoryId?: string
}

interface StoryForm {
  title: string
  description: string
  externalRef: string
}

function storyStatusIcon(status: StoryResponse['status']) {
  if (status === 'ESTIMATED') return <CheckCircle2 className="h-4 w-4 text-green-600" />
  if (status === 'SELECTED') return <PlayCircle className="h-4 w-4 text-foreground" />
  return <Circle className="h-4 w-4 text-muted-foreground/40" />
}

export function StoryList({ stories, me, roomId, currentStoryId }: Props) {

  const isHost = me.role === 'HOST'
  const [createOpen, setCreateOpen] = useState(false)
  const [editStory, setEditStory] = useState<StoryResponse | null>(null)
  const [form, setForm] = useState<StoryForm>({ title: '', description: '', externalRef: '' })

 const { createStory, isCreating}= useCreateStory({roomId, options:{
  onSuccess: () => {
    setCreateOpen(false)
  },
}})

const onCreateStory = () => {
  createStory(form)
}

const { updateStory, isUpdating } = useUpdateStory({ roomId, storyId: editStory?.id, options: {
  onSuccess() {
    setEditStory(null)
  },
  onError() {
    setEditStory(null)
  }
} })

  const onUpdateStory = () => {
    if (!editStory) return
    updateStory(form)
  }

    const { deleteStory } = useDeleteStory({ roomId, options: {} })

  const selectMutation = useMutation({
    mutationFn: (storyId: string) => selectStory(roomId, storyId),
    onError: () => toast.error('Erro ao selecionar história'),
  })

  function openEdit(story: StoryResponse) {
    setEditStory(story)
    setForm({
      title: story.title,
      description: story.description ?? '',
      externalRef: story.externalRef ?? '',
    })
  }

  const sorted = [...stories].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <div className="space-y-2 mr-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Histórias ({stories.length})
        </p>
        {isHost && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2"
            onClick={() => {
              setForm({ title: '', description: '', externalRef: '' })
              setCreateOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {sorted.length === 0 && (
        <p className="text-sm font-semibold text-muted-foreground text-center py-4 border-2 border-dashed border-foreground/20">
          Nenhuma história ainda
        </p>
      )}

      {sorted.map((story) => (
        <div
          key={story.id}
          className={`flex items-start gap-2 p-2 border-2 cursor-pointer hover:bg-muted/40 transition-colors ${
            story.id === currentStoryId
              ? 'border-foreground bg-primary/10 shadow-brutal-sm'
              : 'border-foreground/30 hover:border-foreground'
          }`}
          onClick={() => isHost && story.status !== 'SELECTED' && selectMutation.mutate(story.id)}
        >
          <div className="mt-0.5 flex-shrink-0">{storyStatusIcon(story.status)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{story.title}</p>
           
          </div>
          {story.status === 'ESTIMATED' && story.finalEstimate && (
            <Badge variant="default" className="text-xs flex-shrink-0 bg-primary text-primary-foreground">
              {story.finalEstimate}
            </Badge>
          )}
          {isHost && (
            <div className="flex gap-0.5 flex-shrink-0">
              <button
                className="p-1 border border-foreground/30 hover:border-foreground hover:bg-muted cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  openEdit(story)
                }}
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                className="p-1 border border-foreground/30 hover:border-destructive hover:bg-destructive/10 text-destructive cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Remover esta história?')) deleteStory(story.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova história</DialogTitle>
          </DialogHeader>
          <StoryFormFields form={form} onChange={setForm} />
          <Button
            onClick={() => onCreateStory()}
            disabled={!form.title.trim() || isCreating}
          >
            {isCreating ? 'Criando...' : 'Criar'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editStory} onOpenChange={(v) => !v && setEditStory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar história</DialogTitle>
          </DialogHeader>
          <StoryFormFields form={form} onChange={setForm} />
          <Button
            onClick={() => onUpdateStory()}
            disabled={!form.title.trim() || isUpdating}
          >
            {isUpdating ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StoryFormFields({
  form,
  onChange,
}: {
  form: StoryForm
  onChange: (f: StoryForm) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <Input
          placeholder="Título *"
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <Textarea
          placeholder="Descrição (opcional)"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          rows={3}
        />
      </div>
      <div>
        <Input
          placeholder="Referência externa (ex: JIRA-123)"
          value={form.externalRef}
          onChange={(e) => onChange({ ...form, externalRef: e.target.value })}
        />
      </div>
    </div>
  )
}
