# @trezor/zod

[zod](https://zod.dev) with its JIT turned off.

Zod probes `new Function` to decide whether to JIT-compile object parsers. Under a Content Security Policy without `'unsafe-eval'`, the browser reports that probe as a violation even though zod catches it. Importing zod through this package sets `config({ jitless: true })` before any schema is constructed.

It re-exports everything from `zod`.

```ts
import { z } from '@trezor/zod';
```
