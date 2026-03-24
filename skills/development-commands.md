# Development Commands

## Running Applications

```bash
yarn suite:dev             # Web app at http://localhost:8000
yarn suite:dev:desktop     # Desktop Electron app
yarn suite:dev:vite        # Development with Vite (faster hot reload)
```

## Code Quality

```bash
yarn format                # Format code with Prettier
yarn lint:styles --no-tui  # Lint CSS styles (check logs only if exit status is not 0)
yarn lint:js:fix --no-tui  # Auto-fix linting issues (check logs only if exit status is not 0)
yarn type-check --no-tui   # TypeScript type checking (allow 15 minutes, check logs only if exit status is not 0)
yarn nx run @package-scope/package-name:type-check  # TypeScript check of specific package (allow 10 minutes)
```

## Testing

```bash
yarn test:unit             # Run unit tests (allow 15 minutes, check logs only if exit status is not 0)
yarn workspace @package-scope/package-name test:unit  # Test specific package
```

## Build Commands

```bash
yarn build:libs            # Build all libraries (required after dependency changes)
yarn suite:build:web       # Production web build
```
