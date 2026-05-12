# TrezorConnect stub methods get swapped at runtime

Ran into this in the renderer:

```
Error: TrezorConnect.call should never be called from electron renderer
without using ipcProxy
```

from a line like:

```ts
const wrappedApplySettings = connect(TrezorConnect.applySettings);
```

(I know we wouldn't actually write it like that, just bumped into it while playing around.)

What's going on: TrezorConnect ships with stub methods at module load. During boot, `MainDesktop.tsx` walks the singleton and replaces each method with an IPC proxy. That replacement is a property assignment — it doesn't update anything that already grabbed a reference to the old function.

So in `connect-common` (or anything else touching TC before init runs), there are two ways to get burned: calling too early, or stashing a method reference and using it later. Same underlying cause both times — code reaching for the global before it's finalized.

The obvious workaround is `import TrezorConnect from '@trezor/connect/desktop'`. Fine in a desktop-only file, useless for shared code, because shared code can't pick a platform.

The fix that actually works is DI. Pass TC in as a value at the composition root and have everything downstream take it as a parameter. We already have a slot for this — thunks get an `extra` arg via `createThunk` / `createMiddlewareWithExtraDeps`. Today that `extra` carries `services`, `thunks`, `selectors`. If we add `trezorConnect` to it:

```ts
// composition root (suite store setup) — only place that names the global
const extra = {
    services,
    trezorConnect: TrezorConnect, // <—
    // ...
};

// then in any thunk in suite-common, no import of @trezor/connect:
export const applyHomescreen = createThunk(
    'device/applyHomescreen',
    async (params, { extra: { trezorConnect } }) => {
        return trezorConnect.applySettings(params);
    },
);
```

If we wire it like that consistently, shared layers never name the global directly. There's nothing to capture and nothing to go stale — the thunk always uses whatever `trezorConnect` instance the store was set up with.

You can also solve it at build time — conditional exports / bundler aliases per platform, no stub phase. But that's basically DI moved into the build config: each target wires the right module in, and the build has to handle all the combinations (web, electron renderer, electron main, native, etc.). The combinatorics get nasty pretty fast. Works, but doesn't really make things simpler.
