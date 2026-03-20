# Development Commands

## Running Applications

```bash
yarn suite:dev             # Web app at http://localhost:8000
yarn suite:dev:desktop     # Desktop Electron app
yarn suite:dev:vite        # Development with Vite (faster hot reload)
```

## Code Quality

```bash
yarn lint:styles           # Lint CSS styles
yarn lint:js:fix           # Auto-fix linting issues
yarn format                # Format code with Prettier
yarn type-check            # TypeScript type checking (10-15 minutes)
yarn nx run @package-scope/package-name:type-check  # TypeScript check of specific package
```

## Testing

```bash
yarn test:unit             # Run unit tests
yarn workspace @package-scope/package-name test:unit  # Test specific package
```

## Build Commands

```bash
yarn build:libs            # Build all libraries (required after dependency changes)
yarn suite:build:web       # Production web build
```
