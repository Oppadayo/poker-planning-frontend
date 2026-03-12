import { useState } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { Plus, Pencil, Trash2, CheckCircle2, Circle, PlayCircle } from 'lucide-react'
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
import type { ParticipantResponse, StoryResponse } from '@/types'
import { useCreateStory } from '@/hooks/story/use-create-story'
import { useUpdateStory } from '@/hooks/story/use-update-story'
import { useDeleteStory } from '@/hooks/story/use-delete-story'
import { useSelectStory } from '@/hooks/story/use-select-story'

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

  const createForm = useForm<StoryForm>({
    defaultValues: { title: '', description: '', externalRef: '' },
  })

  const editForm = useForm<StoryForm>()

  const { createStory, isCreating } = useCreateStory({
    roomId,
    options: {
      onSuccess: () => {
        setCreateOpen(false)
        createForm.reset()
      },
    },
  })

  const { updateStory, isUpdating } = useUpdateStory({
    roomId,
    storyId: editStory?.id || '',
    options: {
      onSuccess() { setEditStory(null) },
      onError() { setEditStory(null) },
    },
  })

  const { deleteStory } = useDeleteStory({ roomId, options: {} })
  const { selectStory } = useSelectStory({ roomId })

  function openEdit(story: StoryResponse) {
    setEditStory(story)
    editForm.reset({
      title: story.title,
      description: story.description ?? '',
      externalRef: story.externalRef ?? '',
    })
  }

  const onCreateStory = createForm.handleSubmit((data) => createStory(data))
  const onUpdateStory = editForm.handleSubmit((data) => {
    if (!editStory) return
    updateStory(data)
  })

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
              createForm.reset()
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
          onClick={() => isHost && story.status !== 'SELECTED' && selectStory(story.id)}
        >
          <div className="mt-0.5 flex-shrink-0">{storyStatusIcon(story.status)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{story.title}</p>
          </div>
          {story.finalEstimate && (
            <Badge variant="default" className="text-xs flex-shrink-0 bg-primary text-primary-foreground">
              {story.finalEstimate}
            </Badge>
          )}
          {isHost && (
            <div className="flex gap-0.5 flex-shrink-0">
              <button
                className="p-1 border border-foreground/30 hover:border-foreground hover:bg-muted cursor-pointer"
                onClick={(e) => { e.stopPropagation(); openEdit(story) }}
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
      <Dialog open={createOpen} onOpenChange={(v) => { if (!v) { setCreateOpen(false); createForm.reset() } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova história</DialogTitle>
          </DialogHeader>
          <StoryFormFields form={createForm} />
          <Button onClick={onCreateStory} disabled={isCreating}>
            {isCreating ? 'Criando...' : 'Criar'}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editStory} onOpenChange={(v) => { if (!v) setEditStory(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar história</DialogTitle>
          </DialogHeader>
          <StoryFormFields form={editForm} />
          <Button onClick={onUpdateStory} disabled={isUpdating}>
            {isUpdating ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StoryFormFields({ form }: { form: UseFormReturn<StoryForm> }) {
  return (
    <div className="space-y-3">
      <Input
        placeholder="Título *"
        {...form.register('title', { required: true })}
      />
      <Textarea
        placeholder="Descrição (opcional)"
        {...form.register('description')}
        rows={3}
      />
      <Input
        placeholder="Referência externa (ex: JIRA-123)"
        {...form.register('externalRef')}
      />
    </div>
  )
}
