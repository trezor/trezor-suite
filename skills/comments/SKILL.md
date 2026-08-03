---
name: comments
description: Comment conventions for Trezor Suite. Use when adding, editing, or reviewing code comments, JSDoc, JSX comments, TODOs, or suppression directives.
---

# Comments

- Prefer self-documenting code. Rename or restructure unclear code instead of adding a comment
  that only restates what it does.
- Comment information the code cannot express: rationale, invariants, non-obvious constraints,
  workarounds, and edge cases.
- Keep comments synchronized with the code. Remove stale comments and commented-out code.
- Write prose comments as complete sentences: start with an uppercase letter, end with punctuation,
  and wrap consecutive `//` lines at the print width.
- Do not apply prose rules to tool directives such as `eslint-disable`, `@ts-expect-error`, coverage
  pragmas, URLs, or generated comments.
- When suppressing a lint or type error, include the reason where the directive syntax supports it.
- Use `/** */` when editor- or tool-consumed documentation adds value, such as public API behavior or
  `@deprecated`. Do not repeat information already expressed by TypeScript types or the function
  signature.
- In JSX, place `{/* ... */}` immediately before the node it describes.

```tsx
// Firmware < 2.6.0 reports fees in a different unit, so normalize them here.
const normalizedFee = normalizeFee(rawFee, firmwareVersion);
```
