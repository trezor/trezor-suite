# File Structure

## Barrel (index.ts) files

Use them in packages to define public interface.

Do not use them inside a module to export from directory. If you feel it shall be more separated, create a new package. They can introduce accidental circular dependencies and hurt tree-shaking.
