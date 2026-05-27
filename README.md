# Omnichannel POS

A full-stack MERN application designed for modern retail businesses to manage sales, and multi-store operations in real time. The system supports secure role-based authentication, POS billing, inventory tracking, order management, Redis caching, and responsive dashboards with a scalable cloud-native architecture using Docker and CI/CD pipelines.

## Tech Stack (Week 1)
- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis (ioredis)
- **Validation**: Zod
- **Testing**: Vitest
- **Security**: JWT & bcryptjs

## Folder Structure
- `client/` - Frontend client code
- `server/` - Backend API server
  - `src/config/` - Database and cache connection clients
  - `src/models/` - Mongoose schemas
  - `src/controllers/` - Business logic controllers
  - `src/routes/` - Express API routes
  - `src/middleware/` - Auth, RBAC, and error handlers
  - `src/utils/` - Shared helper utilities
  - `src/types/` - TypeScript typings & type augmentation
  - `src/__tests__/` - Test suites

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) and Docker Compose

### Installation
1. Clone the repository and change directory:
   ```bash
   git clone https://github.com/<your-username>/omnichannel-pos.git
   cd omnichannel-pos
   ```
2. Setup environment variables:
   ```bash
   cp server/.env.example server/.env
   ```
   Modify `server/.env` with your credentials/secrets.

3. Spin up MongoDB and Redis using Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts (inside `server/`)
- `npm run dev` - Starts the development server with hot-reloading (`ts-node-dev`)
- `npm run build` - Compiles TypeScript files into the `dist/` folder
- `npm run start` - Starts the production server using the built Javascript files
- `npm run typecheck` - Performs static type-checking using the TypeScript compiler
- `npm run test` - Runs the Vitest test suites
- `npm run lint` - Runs ESLint to check for stylistic and code quality issues
