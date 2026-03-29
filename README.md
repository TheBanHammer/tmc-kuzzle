# TMC Kuzzle

A lightweight starter repository for running and developing on TMC Kuzzle using Docker.
This project includes a pre-configured local server, data mappings, and helper endpoints for basic user/profile/role workflows.

> This repository is provided as-is and may contain security vulnerabilities due to outdated dependencies. Contributions to update dependencies are welcome via pull requests.

## Repository layout

- `docker-compose.yml`
  - Orchestrates the stack for local development.
  - Defines services such as Kuzzle, MongoDB, Redis, and any proxy/front service.

- `kuzzle.dockerfile`
  - Custom Dockerfile used by `docker-compose` to build the Kuzzle app image.

- `package.json`
  - NPM scripts and dependencies for the application server in `src/`.

- `tsconfig.json`
  - TypeScript compiler options.

- `src/`
  - All server-side TypeScript code and configuration.

### `src` breakdown

- `src/server.ts`
  - Entry point for the Node/TypeScript process.
  - Starts the Kuzzle SDK client and initializes all application routes and handlers.

- `src/config.ts`
  - Central configuration file controlling environment defaults (e.g., host, port, domain).

- `src/users.ts`
  - User management helpers and initial onboarding logic.

- `src/roles.ts`
  - Internal role definitions and role assignment helpers.

- `src/profiles.ts`
  - Profile management and role-to-permission mapping, e.g. “admin”, “user”, “operator”.

- `src/mappings/`
  - JSON mapping definitions for each collection index used by the sample app.
  - Each JSON file defines fields, data types, analyzers, and index settings to register in Kuzzle.

### `src/mappings` common files

- `bank_*`, `burner_*`, `calls.json`, `chats.json`, etc.
  - Domain-specific schema mappings for internal sample apps.
  - Each file corresponds to a Kuzzle collection to create/seed.

- `src/mappings/index.ts`
  - Helper to load and apply all mapping files on Kuzzle startup.

## Setup (Local Dev)

Requirements:
- Docker (Desktop) installed and running
- Node.js (recommended 18+)

1. Clone the repository:
   - `git clone <repo-url>`
   - `cd tmc-kuzzle`

2. Install dependencies:
   - `npm install`

3. Start the stack:
   - `npm start`
   - This command should run `docker-compose up --build` (or equivalent) and create:
     - Kuzzle server container
     - ElasticSearch container
     - Redis container

4. Verify startup:
   - Open browser to `http://localhost:7512` (default Kuzzle HTTP API endpoint)
   - Check logs from `docker-compose` for any startup errors.

5. (Optional) Secure with HTTPS:
   - Use a reverse proxy such as Traefik/Nginx/caddy in front of the Kuzzle HTTP port.
   - Configure TLS certs and set the proxy to forward to Kuzzle.
   - Or, expose Kuzzle directly if HTTPS is not required in your local environment.

## Data initialization and usage

- The app uses mappings in `src/mappings/`.
- On startup, the code usually checks and creates indexes/collections from those mapping JSON files.
- After Kuzzle is running, you can interact via the Kuzzle API:
  - HTTP endpoint: `http://localhost:7512/_search`, `/_mGet`, `/_security/...`, etc.
  - By default there are sample collections like `messages`, `chats`, `users`, etc.

## Troubleshooting

- If `npm start` fails with docker error:
  - Ensure Docker engine is running.
  - Check for port collisions on `7512`, `27017`, `6379`.

- If Kuzzle cannot connect to ElasticSearch/Redis:
  - Ensure services are healthy (`docker ps`).
  - Check network and environment variables in `docker-compose.yml`.

- For fresh state, run:
  - `docker-compose down -v` (remove volumes)
  - `docker-compose up --build`

## Notes

- This example is intentionally minimal and for demonstration purposes.
- Extend `src/users.ts`, `src/roles.ts`, `src/profiles.ts`, and mapping definitions for your application domain.
- Keep secrets out of source control and use environment variables for production credentials.
