### Entrega — Desafio: Gerenciador de Tarefas (Nest.js + Vite + Prisma + Redis + MQTT)

Repositório público (GitHub):
- `https://github.com/orquestradordeia/con3cthus-t0d0-pr0j3ct`

### Conteúdo da solução

- Backend: `Nest.js` com `Prisma` (PostgreSQL), `JWT Auth`, `Redis` (cache de perfil e lista), `MQTT` (publicação `users/<userId>/tasks/created`), `Swagger` em `/api`.
- Frontend: `Vite + React` (Auth, CRUD de tarefas, filtros por status e data, assinatura MQTT por usuário, testes Jest + RTL).
- Mobile: `React Native (Expo)` (Auth com `AsyncStorage`, CRUD, assinatura MQTT por usuário, tela de detalhes/edição), `Dockerfile` e serviço no Compose.
- Infra: `docker-compose.yml` com `backend`, `frontend`, `mobile`, `postgres`, `redis`, `mqtt (mosquitto)` e config em `infra/mosquitto/mosquitto.conf`.
- Documentação: `README.md` (instruções completas), `ENTREGA.md` (este arquivo), `Swagger` no backend.

### Como executar sem Docker local (gratuito, sem cartão)

1) Play with Docker — `https://labs.play-with-docker.com`
- Crie sessão → `git clone https://github.com/orquestradordeia/con3cthus-t0d0-pr0j3ct.git`
- `cd con3cthus-t0d0-pr0j3ct`
- `docker compose up -d --build`
- `docker compose exec backend npx prisma generate`
- `docker compose exec backend npx prisma migrate deploy`

2) GitHub Codespaces — plano Free sem cartão
- Abra o repositório → Codespaces → criar codespace
- Terminal:
  - `docker compose up -d --build`
  - `docker compose exec backend npx prisma generate`
  - `docker compose exec backend npx prisma migrate deploy`

### Endpoints principais (REST)

- Auth:
  - `POST /auth/register` → { email, password, name } → { token }
  - `POST /auth/login` → { email, password } → { token }
- Users (Bearer JWT):
  - `GET /users/me` → perfil (cache Redis: `user:<userId>`)
  - `PATCH /users/me` → { name? } (invalida cache)
- Tasks (Bearer JWT):
  - `GET /tasks?status=PENDING|DONE&from=YYYY-MM-DD&to=YYYY-MM-DD`
  - `POST /tasks` → { title, description?, dueDate? }
  - `PATCH /tasks/:id` → { title?, description?, status?, dueDate? }
  - `DELETE /tasks/:id`

Swagger: `http://<HOST>:3000/api`

### Cache (Redis)

- Lista de tarefas: chaves `tasks:<userId>:<STATUS|ALL>:<from|NONE>:<to|NONE>` com TTL curto; invalidação em create/update/delete.
- Perfil: chave `user:<userId>`; invalidação em update.

### MQTT (Mosquitto)

- Publicação no backend ao criar tarefa: `users/<userId>/tasks/created` com payload `{ id, title }`.
- Frontend/Mobile assinam o tópico específico do usuário após obter `userId`.

### Variáveis de ambiente (backend)

Exemplo (`backend/.env`):
- `PORT=3000`
- `JWT_SECRET=supersecretjwt`
- `DATABASE_URL=postgresql://app:app@postgres:5432/app?schema=public`
- `REDIS_URL=redis://redis:6379`
- `MQTT_URL=mqtt://mqtt:1883`

### Acesso aos serviços (padrão Compose)

- Backend: `http://localhost:3000` (Swagger em `/api`)
- Frontend: `http://localhost:5173`
- Mosquitto: `mqtt://localhost:1883` e `ws://localhost:9001`
- Redis: `localhost:6379`
- Postgres: `localhost:5432`

### Testes

- Backend: `docker compose exec backend npm test`
- Frontend: `cd frontend && npm test`

### Versionamento (Git)

- Histórico granular com commits descritivos (infra, backend base, auth, users+cache, tasks+MQTT, testes backend, frontend com MQTT e filtros, mobile, testes frontend, ajustes finais).


