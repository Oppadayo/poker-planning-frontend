import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type {
  ParticipantResponse,
  RoundResponse,
  StoryResponse,
  VoteResponse,
} from '@/types'
import { DECK_VALUES } from '@/types'
import { useStartRound } from '@/hooks/round/use-start-round'
import { useCastVote } from '@/hooks/round/use-cast-vote'
import { useRevealVotes } from '@/hooks/round/use-reveal-votes'
import { useResetRound } from '@/hooks/round/use-reset-round'
import { useFinalizeRound } from '@/hooks/round/use-finalize-round'

interface Props {
  round: RoundResponse | undefined
  me: ParticipantResponse
  participants: ParticipantResponse[]
  currentStory: StoryResponse | undefined
  roomId: string
  deckType: string
  onVoteSent?: (value: string) => void
}

export function VotingArea({
  round,
  me,
  participants,
  currentStory,
  roomId,
  deckType,
  onVoteSent,
}: Props) {
  const isHost = me.role === 'HOST'
  const isObserver = me.role === 'OBSERVER'
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [finalEstimate, setFinalEstimate] = useState('')
  const [customVote, setCustomVote] = useState('')

  const deckValues = DECK_VALUES[deckType as keyof typeof DECK_VALUES] ?? []

  const { startRound, isStarting } = useStartRound({
    roomId,
    options: { onSuccess: () => setSelectedCard(null) },
  })

  const { castVote, isCasting } = useCastVote({
    roomId,
    options: {
      onSuccess: (value) => {
        setSelectedCard(value)
        onVoteSent?.(value)
      },
    },
  })

  const { revealVotes, isRevealing } = useRevealVotes({ roomId })

  const { resetRound, isResetting } = useResetRound({
    roomId,
    options: { onSuccess: () => setSelectedCard(null) },
  })

  const { finalizeRound, isFinalizing } = useFinalizeRound({
    roomId,
    options: {
      onSuccess: () => {
        setFinalEstimate('')
        setSelectedCard(null)
      },
    },
  })

  // No active round
  if (!round || round.status === 'FINALIZED') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        {currentStory ? (
          <>
            <div className="border-2 border-foreground bg-card px-4 py-3 shadow-brutal">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">História selecionada</p>
              <p className="font-extrabold text-xl">{currentStory.title}</p>
              {currentStory.finalEstimate && (
                <p className="text-sm font-semibold text-muted-foreground mt-1">
                  Estimativa: <span className="font-extrabold text-foreground">{currentStory.finalEstimate}</span>
                </p>
              )}
            </div>
            {isHost && (
              <Button size="lg" onClick={() => startRound()} disabled={isStarting}>
                {isStarting ? 'Iniciando...' : '▶ Iniciar votação'}
              </Button>
            )}
            {!isHost && (
              <p className="text-sm font-semibold text-muted-foreground">Aguardando o host iniciar a votação...</p>
            )}
          </>
        ) : (
          <p className="font-semibold text-muted-foreground border-2 border-dashed border-muted-foreground/30 px-6 py-4">
            {isHost ? 'Selecione uma história para iniciar a votação' : 'Aguardando o host selecionar uma história...'}
          </p>
        )}
      </div>
    )
  }


  const votes = round.votes ?? []
  const votedCount = votes.filter((v) => v.hasVoted).length
  const totalVoters = participants.filter((p) => p.role !== 'OBSERVER').length

  return (
    <div className="space-y-6">
      {/* Story title */}
      {currentStory && (
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Votando em</p>
          <p className="font-extrabold text-xl mt-1">{currentStory.title}</p>
        </div>
      )}

      {/* Vote progress */}
      <div className="text-center">
        <span className="inline-block border-2 border-foreground px-3 py-1 font-bold text-sm bg-card shadow-brutal-sm">
          {votedCount}/{totalVoters} votaram
        </span>
      </div>

      {/* Participants vote status */}
      <div className="flex flex-wrap gap-3 justify-center">
        {participants.map((p) => {
          if (p.role === 'OBSERVER') return null
          const vote = votes.find((v) => v.participantId === p.id)
          const hasVoted = vote?.hasVoted ?? false
          const revealed = round.status === 'REVEALED'

          return (
            <div
              key={p.id}
              className={`flex flex-col items-center gap-1 p-2 border-2 min-w-[4rem] ${
                hasVoted ? 'border-foreground bg-primary/10 shadow-brutal-sm' : 'border-foreground/30 border-dashed'
              }`}
            >
              <div
                className={`w-10 h-14 flex items-center justify-center text-sm font-extrabold border-2 ${
                  hasVoted
                    ? revealed
                      ? 'bg-primary text-primary-foreground border-foreground shadow-brutal-sm'
                      : 'bg-secondary border-foreground'
                    : 'bg-background border-dashed border-foreground/30'
                }`}
              >
                {revealed && vote?.value ? vote.value : hasVoted ? '✓' : '?'}
              </div>
              <span className="text-xs font-bold truncate max-w-[4rem]">{p.displayName}</span>
            </div>
          )
        })}
      </div>

      {/* Voting deck */}
      {round.status === 'VOTING' && !isObserver && (
        <div className="space-y-3">
          <p className="text-sm text-center font-bold uppercase tracking-wider text-muted-foreground">Escolha sua carta</p>
          {deckValues.length > 0 ? (
            <div className="flex flex-wrap gap-3 justify-center">
              {deckValues.map((v) => (
                <button
                  key={v}
                  onClick={() => castVote(v)}
                  disabled={isCasting}
                  className={`w-14 h-20 border-2 border-foreground text-lg font-extrabold transition-[transform,box-shadow] cursor-pointer select-none ${
                    selectedCard === v
                      ? 'bg-primary text-primary-foreground translate-x-[4px] translate-y-[4px] shadow-none'
                      : 'bg-card shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2 max-w-xs mx-auto">
              <Input
                placeholder="Valor customizado"
                value={customVote}
                onChange={(e) => setCustomVote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customVote.trim()) {
                    castVote(customVote.trim())
                  }
                }}
              />
              <Button
                onClick={() => castVote(customVote.trim())}
                disabled={!customVote.trim() || isCasting}
              >
                Votar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Revealed vote stats */}
      {round.status === 'REVEALED' && (
        <VoteStats votes={votes} participants={participants} />
      )}

      {/* Host controls */}
      {isHost && (
        <div className="flex flex-wrap gap-2 justify-center pt-3 border-t-2 border-foreground">
          {round.status === 'VOTING' && (
            <Button
              variant="secondary"
              onClick={() => revealVotes()}
              disabled={isRevealing}
            >
              Revelar votos
            </Button>
          )}
          {round.status === 'REVEALED' && (
            <>
              <Button
                variant="outline"
                onClick={() => resetRound()}
                disabled={isResetting}
              >
                Revotar
              </Button>
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Estimativa final"
                  className="w-36"
                  value={finalEstimate}
                  onChange={(e) => setFinalEstimate(e.target.value)}
                />
                <Button
                  onClick={() => finalizeRound(finalEstimate)}
                  disabled={!finalEstimate.trim() || isFinalizing}
                >
                  Finalizar
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function VoteStats({
  votes,
  participants,
}: {
  votes: VoteResponse[]
  participants: ParticipantResponse[]
}) {
  const valueMap: Record<string, number> = {}
  votes.forEach((v) => {
    if (v.value) valueMap[v.value] = (valueMap[v.value] ?? 0) + 1
  })
  const entries = Object.entries(valueMap).sort((a, b) => b[1] - a[1])
  const totalVotes = votes.filter((v) => v.hasVoted).length

  const numericValues = votes
    .filter((v) => v.value && !isNaN(Number(v.value)))
    .map((v) => Number(v.value))

  const avg =
    numericValues.length > 0
      ? (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(1)
      : null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 justify-center">
        {entries.map(([val, count]) => (
          <div key={val} className="flex flex-col items-center gap-1">
            <div className="w-14 h-20 border-2 border-foreground bg-primary flex items-center justify-center text-lg font-extrabold shadow-brutal">
              {val}
            </div>
            <Badge variant="default" className="text-xs">
              {count}/{totalVotes}
            </Badge>
          </div>
        ))}
      </div>

      {avg !== null && (
        <p className="text-center font-bold text-base">
          Média: <span className="font-extrabold text-xl">{avg}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
        {votes
          .filter((v) => v.hasVoted)
          .map((v) => {
            const p = participants.find((p) => p.id === v.participantId)
            return (
              <span key={v.participantId}>
                {p?.displayName}: <span className="font-medium text-foreground">{v.value}</span>
              </span>
            )
          })}
      </div>
    </div>
  )
}
