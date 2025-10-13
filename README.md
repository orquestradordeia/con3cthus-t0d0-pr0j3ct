### Desafio Conecthus — Gerenciador de Tarefas (Nest.js + Vite + Prisma + Redis + MQTT)

Aplicação full stack com autenticação JWT, CRUD de tarefas, cache Redis e notificações via MQTT. Inclui frontend (Vite React), backend (Nest.js), mobile (React Native/Expo), banco (PostgreSQL), Redis e broker MQTT (Eclipse Mosquitto), todos orquestrados via Docker Compose.

### Execução sem Docker local (gratuito e sem cartão)

- **Play with Docker (PWD)**: sessões efêmeras (~4h) com Docker e Docker Compose completos. Login via Docker Hub. Ideal para subir rapidamente o `docker-compose.yml` sem instalar nada localmente.
  - Acesse `https://labs.play-with-docker.com`
  - Crie uma instância, faça upload do repositório (via `git clone`), e rode `docker compose up -d`.
- **GitHub Codespaces**: ambiente de dev em contêiner com horas gratuitas no plano Free. Não exige cartão para contas Free. Permite `devcontainer` com serviços. Ideal para desenvolver e testar.
  - Abra o repositório e clique em "Code" → "Codespaces" → "Create codespace".
  - Use o terminal para `docker compose up -d` (serviços definidos no `devcontainer.json` também podem ser usados, se configurado).

Observação: Render/Fly/Railway costumam exigir cartão para deploy persistente. Para avaliação sem cartão, prefira PWD e Codespaces.

### Serviços

- Backend `Nest.js` com `Prisma` (PostgreSQL), `Redis` (cache) e MQTT (publicação via broker Mosquitto)
- Frontend `Vite React` (SPA) consumindo a API e assinando MQTT
- Mobile `React Native (Expo)` consumindo a API e MQTT
- Infra: `PostgreSQL`, `Redis`, `Mosquitto`

### Subir todos os serviços (em ambiente que tenha Docker disponível)

```bash
docker compose up -d --build
```

Após subir:
- API Nest: `http://localhost:3000` (Swagger em `http://localhost:3000/api`)
- Frontend: `http://localhost:5173`
- Mosquitto: `mqtt://localhost:1883` (WS em `ws://localhost:9001`)
- Redis: `localhost:6379`
- Postgres: `localhost:5432`

### Estrutura

```
backend/           # Nest.js + Prisma + Swagger + Redis + MQTT
frontend/          # Vite React + Auth + CRUD + MQTT
mobile/            # React Native (Expo) + Auth + CRUD + MQTT
docker-compose.yml # Orquestra todos os serviços
```

### Variáveis de ambiente

Copie `backend/.env.example` para `backend/.env` e ajuste conforme necessário.

### Fluxo de desenvolvimento

1. Edite modelos Prisma e rode migrações quando necessário.
2. Implemente endpoints e serviços no backend.
3. Consuma a API no frontend/mobile.
4. Use cache Redis para perfis e lista de tarefas e invalide no CRUD.
5. Publique mensagens MQTT ao criar tarefas.

### Testes

- Backend: Jest (unitários e integração). Com banco de testes isolado.
- Frontend: React Testing Library.

### Como rodar testes no backend

Ambientes remotos (PWD ou Codespaces):

```bash
# subir serviços
docker compose up -d --build

# gerar client e aplicar migrações no container do backend
docker compose exec backend npx prisma generate
docker compose exec backend npx prisma migrate deploy

# rodar testes
docker compose exec backend npm test
```

### Fluxo Git sugerido

1) Antes de commitar, rode `tsc` no backend e frontend para checar tipos:

```bash
(cd backend && npx tsc -p tsconfig.json)
(cd frontend && npx tsc -p tsconfig.json)
```

2) Commits pequenos e descritivos (ex.: `feat(backend): auth JWT`, `feat(frontend): CRUD tarefas`)

3) Push para o repositório remoto.

### Git

Siga commits pequenos e descritivos. Antes de `git push`, rode `tsc` para validação de tipos.


