# Poker Planning - Frontend

Interface web para sessoes colaborativas de planning poker. Permite que equipes estimem historias de usuario em tempo real, com suporte a usuarios convidados (sem cadastro) e usuarios autenticados.

---

## Tecnologias

- **React 19** com TypeScript
- **Vite 7** como bundler e dev server
- **Tailwind CSS v4** para estilizacao
- **shadcn/ui** + **Radix UI** para componentes de interface
- **React Router v7** para roteamento
- **TanStack Query v5** para gerenciamento de estado do servidor e cache
- **Zustand v5** para estado global do cliente
- **React Hook Form** + **Zod** para formularios com validacao
- **STOMP over SockJS** para comunicacao em tempo real via WebSocket
- **Axios** para requisicoes HTTP
- **Sonner** para notificacoes toast

---

## Estrutura do projeto

```
src/
  api/           # Funcoes de chamada a API REST
    auth.ts        # Login e registro
    client.ts      # Instancia do axios com interceptors de auth
    invites.ts     # Criacao, listagem e revogacao de convites
    me.ts          # Sessoes do usuario autenticado
    rooms.ts       # CRUD de salas, entrar, sair, kick, transfer host
    rounds.ts      # Iniciar, votar, revelar, resetar e finalizar rodadas
    stories.ts     # CRUD de historias e reordenacao
  components/
    auth/          # Modal de login e registro
    room/          # Componentes da sala (header, participantes, historias, votacao, convites)
    ui/            # Componentes base do shadcn/ui
  hooks/
    useWebSocket.ts  # Hook que gerencia conexao STOMP e sincroniza cache do React Query
  lib/
    utils.ts         # Utilitarios (cn para classes Tailwind)
  routes/
    HomePage.tsx     # Pagina inicial: criar sala, entrar por codigo, sessoes recentes
    RoomPage.tsx     # Pagina da sala com todo o fluxo de votacao
    InvitePage.tsx   # Pagina de aceitacao de convite por token
  store/
    identityStore.ts  # Estado persistido: identidade do usuario (guest ou autenticado)
    wsStore.ts        # Status da conexao WebSocket e IDs de eventos ja processados
  types/
    index.ts          # Todos os tipos TypeScript e constantes de deck
  main.tsx
  App.tsx
```

---

## Funcionalidades

### Acesso sem cadastro (guest)

Qualquer pessoa pode criar ou entrar em uma sala sem criar uma conta. Um `guestId` e gerado automaticamente via `crypto.randomUUID()` e persistido no `localStorage`. Ao criar uma sala como guest, o servidor retorna um `guestToken` que autoriza operacoes de host (fechar sala, kickar participantes, transferir host).

### Autenticacao

Usuarios podem criar uma conta ou fazer login. O JWT retornado e armazenado via `identityStore` (Zustand com persistencia no `localStorage`). Usuarios autenticados tem acesso ao historico de suas sessoes na pagina inicial.

### Salas

- Criacao com nome, deck e permissao de observers
- Entrada por codigo de 6 caracteres
- Entrada por link de convite com role predefinida
- Roles: `HOST`, `PARTICIPANT`, `OBSERVER`
- O host pode: fechar a sala, kickar participantes, transferir a funcao de host

### Decks disponiveis

| Tipo           | Valores                                      |
|----------------|----------------------------------------------|
| Fibonacci      | 0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ?, coffee |
| T-Shirt        | XS, S, M, L, XL, XXL, ?                     |
| Powers of Two  | 1, 2, 4, 8, 16, 32, 64, ?                   |
| Custom         | Configuravel                                 |

### Fluxo de votacao

1. Host seleciona uma historia do backlog
2. Host inicia a rodada
3. Participantes votam (votos ficam ocultos ate a revelacao)
4. Host revela os votos
5. Host finaliza a rodada com a estimativa final
6. A historia e marcada como `ESTIMATED`
7. Host pode resetar a rodada para votar novamente

### Tempo real (WebSocket)

A conexao usa STOMP sobre SockJS. O hook `useWebSocket` assina o topico `/topic/rooms/{roomId}/events` e atualiza o cache do React Query diretamente via `queryClient.setQueryData`, evitando refetch desnecessario. Eventos processados sao rastreados por `eventId` para evitar duplicidade.

Eventos suportados:

- `PARTICIPANT_JOINED`, `PARTICIPANT_LEFT`, `PARTICIPANT_KICKED`, `HOST_TRANSFERRED`
- `STORY_CREATED`, `STORY_UPDATED`, `STORY_DELETED`, `STORY_REORDERED`, `STORY_SELECTED`
- `ROUND_STARTED`, `VOTE_CAST`, `ROUND_REVEALED`, `ROUND_RESET`, `ROUND_FINALIZED`
- `ROOM_CLOSED`, `STATE_SNAPSHOT`

### Convites

O host pode gerar links de convite com role especifica (`PARTICIPANT` ou `OBSERVER`), data de expiracao opcional e limite de usos. Links revogados deixam de funcionar imediatamente.


## Instalacao e execucao

**Requisitos:** Node.js 20+ e npm.

```bash
# Instalar dependencias
npm install

# Iniciar em modo de desenvolvimento (hot reload)
npm run dev

# Checar erros de tipo e lint
npm run lint

# Gerar build de producao
npm run build

# Servir o build localmente
npm run preview
```

O servidor de desenvolvimento sobe em `http://localhost:5173` por padrao.

---

## Build de producao

```bash
npm run build
```

Os arquivos estaticos sao gerados em `dist/`. Podem ser servidos por qualquer servidor HTTP estatico (Nginx, Caddy, etc.) ou plataformas como Vercel, Netlify e Cloudflare Pages.

Para deploy em subpath (ex: `https://example.com/app`), configure `base` no `vite.config.ts`:

```ts
export default defineConfig({
  base: '/app/',
  // ...
})
```

---

## Configuracao de path alias

O alias `@/` aponta para `src/`. Configurado em `vite.config.ts` e em `tsconfig.json`:

```ts
// vite.config.ts
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}
```

Exemplos de uso:

```ts
import { apiClient } from '@/api/client'
import { useIdentityStore } from '@/store/identityStore'
```

---

## Autenticacao e headers

O `apiClient` (Axios) injeta automaticamente o header correto em cada requisicao:

- Se o usuario esta autenticado: `Authorization: Bearer <token>`
- Se o usuario e guest: `X-Guest-Id: <guestId>`

Operacoes exclusivas do host (fechar sala, kickar, etc.) requerem adicionalmente o header `X-Guest-Token: <guestToken>` quando o host e um usuario guest. A funcao `withGuestToken(roomId)` retorna esse header consultando o `localStorage`.

---

## Componentes de UI

Os componentes base em `src/components/ui/` sao gerados pelo `shadcn/ui` e configurados via `components.json`. Para adicionar novos componentes:

```bash
npx shadcn@latest add <component-name>
```

---

## Backend

Este frontend consome a API REST e o endpoint WebSocket do servico `poker-planning-server`. O contrato completo esta definido em `src/types/index.ts`.