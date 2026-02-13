# Symlinked docs files

- Some documentation in better to have next to the code, or in agent `skills` dir, instead of `docs` dir, where devs might not find it.
- That's why some files are symlinked to the docs, so they can still be part of the human-readable [md book](https://docs.trezor.io/trezor-suite/)
- But some CI checks crash on symlinks (confirmed for `prettier` via `nx`)
- That's why the symlinks are in a single folder → ignored in `.prettierignore` and `.nxignore`
