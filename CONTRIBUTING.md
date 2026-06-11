# Contributing to ZyroMart Server

Thank you for your interest in contributing! All contributions — bug fixes, new features, documentation improvements — are welcome.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
   ```bash
   git clone https://github.com/sakib-atreus/ZyroMart-server
   cd ZyroMart-server
   ```
3. **Install** dependencies
   ```bash
   npm install
   ```
4. **Copy the environment file** and fill in your values
   ```bash
   cp .env.example .env
   ```
5. **Create a branch** from `develop`
   ```bash
   git checkout develop
   git checkout -b feature/your-feature-name
   ```

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only |
| `develop` | Integration branch — target this for PRs |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `hotfix/*` | Critical production fixes |

## Module Structure

Each new business domain must follow the existing pattern under `src/modules/`:

```
{module}/
├── {module}.model.ts        # Mongoose schema & model
├── {module}.interface.ts    # TypeScript types & interfaces
├── {module}.service.ts      # Business logic
├── {module}.controller.ts   # HTTP request handlers
├── {module}.route.ts        # Express router
└── {module}.validation.ts   # Zod request schemas
```

## Code Standards

- All code must be TypeScript with proper types — avoid `any`
- Validate all request bodies with a Zod schema via the `validateRequest` middleware
- Protect all routes with the `auth` middleware and specify required role(s)
- Business logic belongs in the service layer, not the controller

## Before Opening a PR

```bash
# Fix lint issues
npm run lint:fix

# Format code
npm run prettier:fix

# Test affected endpoints manually with Postman or Insomnia
npm run start:dev
```

## Commit Messages

Use short, imperative commit messages:

```
feat: add vendor suspension endpoint
fix: correct order snapshot price on variant update
refactor: extract payment webhook logic into service
docs: add missing env variables to README
```

## Opening a Pull Request

1. Push your branch to your fork
2. Open a PR targeting the **`develop`** branch of this repository
3. In the PR description, include:
   - What changed and why
   - Any new environment variables added
   - Endpoints affected or added

At least one maintainer review is required before merging.

## What NOT to Commit

- `.env` files or secrets
- `dist/` build output
- `node_modules/`

## Contact

For questions before contributing, reach out at [sakibmia0718@gmail.com](mailto:sakibmia0718@gmail.com) or open an issue.
