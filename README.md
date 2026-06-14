# docker-postgres-lab

Ambiente multi-container com Docker Compose: aplicação Node.js/Express e banco PostgreSQL, com persistência de dados, rede isolada e usuário dedicado para a aplicação.

## Arquitetura

```
┌─────────────────────┐     backend-network     ┌──────────────────────┐
│  docker-postgres-   │ ──────────────────────► │  docker-postgres-    │
│  lab-app  :3000     │      DB_HOST=postgres   │  lab-db   :5432      │
└─────────────────────┘                         └──────────────────────┘
         │                                                  │
         │ env_file (.env)                                  │ volume postgres_data
         └──────────────────────────────────────────────────┘
```

| Serviço    | Container               | Descrição                          |
|------------|-------------------------|------------------------------------|
| `app`      | `docker-postgres-lab-app` | API Express com health checks    |
| `postgres` | `docker-postgres-lab-db`  | PostgreSQL 17 Alpine             |

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Configuração

1. Clone o repositório e entre na pasta do projeto.

2. Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

3. Ajuste os valores em `.env` conforme necessário. **Nunca commite o arquivo `.env`** — ele contém credenciais sensíveis.

### Variáveis de ambiente

| Variável             | Descrição                                      |
|----------------------|------------------------------------------------|
| `PORT`               | Porta exposta pela aplicação                   |
| `DB_HOST`            | Host do banco (nome do serviço no Compose)     |
| `DB_PORT`            | Porta do PostgreSQL                            |
| `DB_NAME`            | Nome do banco usado pela aplicação             |
| `DB_USER`            | Usuário dedicado da aplicação                  |
| `DB_PASSWORD`        | Senha do usuário da aplicação                  |
| `POSTGRES_DB`        | Banco criado na inicialização do Postgres      |
| `POSTGRES_USER`      | Superusuário do Postgres (administração)       |
| `POSTGRES_PASSWORD`  | Senha do superusuário                          |

## Executando

Subir os containers em segundo plano:

```bash
docker compose up --build -d
```

Acompanhar logs:

```bash
docker compose logs -f
```

Parar os containers:

```bash
docker compose down
```

Recriar o banco do zero (apaga todos os dados):

```bash
docker compose down -v
docker compose up --build -d
```

> O script `db/init.sh` roda **apenas na primeira inicialização** do volume. Se alterar usuário ou permissões, recrie o volume com `docker compose down -v`.

## Testando a conexão

Health check da aplicação:

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{"status":"ok"}
```

Health check da conexão com o banco:

```bash
curl http://localhost:3000/health/db
```

Resposta esperada:

```json
{"status":"ok","database":"connected"}
```

Verificar containers em execução:

```bash
docker compose ps
```

## Segurança do banco de dados

- A aplicação conecta com o usuário **`app_user`**, não com o superusuário `postgres`.
- O script `db/init.sh` cria o usuário da aplicação lendo `DB_USER` e `DB_PASSWORD` das variáveis de ambiente, sem hardcode no código da aplicação.
- Permissões concedidas ao `app_user`:
  - `CONNECT` no banco
  - `USAGE` e `CREATE` no schema `public`
- Credenciais ficam exclusivamente no arquivo `.env`, que está listado no `.gitignore`.

## Desenvolvimento local (sem Docker)

```bash
npm install
cp .env.example .env
# Ajuste DB_HOST=localhost e exponha a porta 5432 do Postgres, se necessário
npm run dev
```

## Estrutura do projeto

```
.
├── db/
│   └── init.sh           # Criação do usuário e permissões do banco
├── src/
│   ├── server.js         # API Express
│   └── database.js       # Pool de conexão PostgreSQL
├── Dockerfile            # Build multi-stage (Alpine)
├── docker-compose.yml    # Orquestração dos serviços
├── .env.example          # Template de variáveis de ambiente
└── README.md
```

## Dockerfile

A imagem da aplicação usa **multi-stage build** com `node:22-alpine`:

1. **Stage `builder`**: instala dependências com `npm ci`
2. **Stage final**: copia apenas os artefatos necessários, reduzindo o tamanho da imagem
