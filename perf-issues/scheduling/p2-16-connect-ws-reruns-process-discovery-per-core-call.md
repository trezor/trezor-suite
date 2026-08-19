# Every connect-ws core call re-resolves the calling process with two subprocess spawns and re-extracts its app icon before the approval dialog is sent to the renderer

Extracted from the `skills/performance-scheduling/SKILL.md` sweep — section _"Schedule non-essential work in an idle callback"_, taken at its premise rather than at its API: the caller's app icon is decoration, and it is resolved on the exact path the user is waiting on. **The honest headline here is not a scheduling primitive, it is a cache.** The peer process behind a websocket connection cannot change for the life of that connection, yet `connect-ws` re-discovers it on every handshake, and `CoreInSuiteDesktop` handshakes before every single core call. The sibling implementation in the same package — the MCP server — already resolves it once per session, so the correct shape is already in the repo. The scheduling contribution is the second half: the icon is awaited inline while the `connect-popup/call` payload is built, so the approval dialog is held behind the OS thumbnailer for a 48×48 badge.

## Where

[`packages/suite-desktop-core/src/libs/connect-ws.ts:142`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/connect-ws.ts#L142) is inside the `POPUP.HANDSHAKE` branch ([`:140`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/connect-ws.ts#L140)) of the per-connection message handler ([`:117`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/connect-ws.ts#L117)). `processOnPort` is a closure variable declared once per connection at [`:104`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/connect-ws.ts#L104) — but it is **unconditionally reassigned** on every handshake, and the handshake reply is only sent afterwards at [`:150`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/connect-ws.ts#L150).

What that lookup costs is the whole argument. [`findProcessFromIncomingPort`](https://github.com/trezor/trezor-suite/blob/develop/packages/node-utils/src/findProcessFromIncomingPort.ts#L31) does not read a cached process table; it shells out, twice, through [`spawn(command, { shell: true })`](https://github.com/trezor/trezor-suite/blob/develop/packages/node-utils/src/findProcessFromIncomingPort.ts#L5):

- macOS and Linux — [`lsof -iTCP:<port> -n -P +c0`](https://github.com/trezor/trezor-suite/blob/develop/packages/node-utils/src/findProcessFromIncomingPort.ts#L38), then [`ps -p <pid> -o comm=`](https://github.com/trezor/trezor-suite/blob/develop/packages/node-utils/src/findProcessFromIncomingPort.ts#L55) or [`cat /proc/<pid>/cmdline`](https://github.com/trezor/trezor-suite/blob/develop/packages/node-utils/src/findProcessFromIncomingPort.ts#L71).
- Windows — [`netstat -ano | findstr :<port>`](https://github.com/trezor/trezor-suite/blob/develop/packages/node-utils/src/findProcessFromIncomingPort.ts#L84), then a whole [`powershell -Command "(Get-Item (Get-Process -Id <pid>).Path).VersionInfo | ConvertTo-Json"`](https://github.com/trezor/trezor-suite/blob/develop/packages/node-utils/src/findProcessFromIncomingPort.ts#L100).

Each is a shell plus the tool it runs, so every handshake is two process trees created and torn down inside the Electron main process. That this is already known to be slow is written into the client: the handshake round trip is given a 3 s timeout at [`core-in-suite-desktop.ts:62`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-web/src/impl/core-in-suite-desktop.ts#L62), with the comment `// can take a while on slower machines due to loading process info` on the line above.

The second half is the icon. [`connect-ws.ts:238`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/connect-ws.ts#L238) awaits [`getProcessIcon`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/process-icon.ts#L9) while constructing the object literal passed to `mainWindow.webContents.send('connect-popup/call', …)` at [`:228`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/connect-ws.ts#L228) — so the IPC message that makes the dialog appear is not sent until [`nativeImage.createThumbnailFromPath`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/process-icon.ts#L23) (macOS) or [`app.getFileIcon`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/process-icon.ts#L13) (Windows) has come back from the OS.

Both costs are paid per call, because [`CoreInSuiteDesktop.call()`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-web/src/impl/core-in-suite-desktop.ts#L133) does `await this.handshake()` unconditionally at [`:138`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-web/src/impl/core-in-suite-desktop.ts#L138), before every `CORE_CALL`.

**The same package already does this correctly.** The MCP server resolves the peer once, on `initialize` ([`mcp-server.ts:1265`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/mcp-server.ts#L1265)), stores name, path, warning bit and icon in a session variable ([`:1104`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/mcp-server.ts#L1104), assigned at [`:1287`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/mcp-server.ts#L1287) with the icon awaited once at [`:1291`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/mcp-server.ts#L1291)), and every later call just reads it at [`:1147`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/mcp-server.ts#L1147). It sends the identical `connect-popup/call` payload. The two paths differ only in that one caches and the other does not.

## Before

`packages/suite-desktop-core/src/libs/connect-ws.ts:104`:

```ts
let processOnPort: ProcessInfo | undefined;
```

`packages/suite-desktop-core/src/libs/connect-ws.ts:140`–`:150`:

```ts
            if (message.type === POPUP.HANDSHAKE) {
                const filterSelf = !process.env.PLAYWRIGHT_RUN; // ignore own process, unless testing
                processOnPort = await findProcessFromIncomingPort(port, filterSelf).catch(() => {
                    logger.error(LOG_PREFIX, 'findProcessFromIncomingPort failed');

                    return undefined;
                });
                manifest = parseManifest(message.payload.settings.manifest);
                version = parseVersion(message.payload.settings.version);
                requestedPermissions = message.payload.settings.requestedPermissions;
                ws.send(JSON.stringify({ id: message.id, type: POPUP.HANDSHAKE, payload: 'ok' }));
```

`packages/suite-desktop-core/src/libs/connect-ws.ts:233`–`:240`:

```ts
                        process: processOnPort
                            ? {
                                  name: processOnPort.name,
                                  fullPath: processOnPort.fullPath,
                                  warning: !!processOnPort.warning,
                                  icon: await getProcessIcon(processOnPort.fullPath),
                              }
                            : undefined,
```

## After

Three hunks, all in `connect-ws.ts`. The lookup moves into a named per-connection function that runs at most once successfully; the icon is started there but awaited only where it is needed.

**1. the connection closure, replacing `:104`–`:109`:**

```ts
let processOnPort: ProcessInfo | undefined;
let processIcon: Promise<string | undefined> | undefined;
const { origin } = req.headers;

let manifest: Manifest | undefined;
let version: string | undefined;
let requestedPermissions: PermissionRequest[] | undefined;

// The peer is identified by the remote port, which is fixed for the life of this
// connection, so the lookup and the icon are resolved on the first handshake and reused
// by every later one. A failed lookup is not stored, so the next handshake retries it.
const resolvePeerProcess = async () => {
    if (processOnPort) return;

    const filterSelf = !process.env.PLAYWRIGHT_RUN; // ignore own process, unless testing
    processOnPort = await findProcessFromIncomingPort(port, filterSelf).catch(() => {
        logger.error(LOG_PREFIX, 'findProcessFromIncomingPort failed');

        return undefined;
    });
    processIcon = processOnPort ? getProcessIcon(processOnPort.fullPath) : undefined;
};
```

**2. the handshake branch at `:140`:**

```ts
            if (message.type === POPUP.HANDSHAKE) {
                await resolvePeerProcess();
                manifest = parseManifest(message.payload.settings.manifest);
                version = parseVersion(message.payload.settings.version);
                requestedPermissions = message.payload.settings.requestedPermissions;
                ws.send(JSON.stringify({ id: message.id, type: POPUP.HANDSHAKE, payload: 'ok' }));
```

**3. the call payload at `:233`:**

```ts
                        process: processOnPort
                            ? {
                                  name: processOnPort.name,
                                  fullPath: processOnPort.fullPath,
                                  warning: !!processOnPort.warning,
                                  icon: await processIcon,
                              }
                            : undefined,
```

The thumbnail now starts during the handshake and runs concurrently with the handshake reply and the client's `CORE_CALL` round trip, instead of starting after the call arrives. On the second and every later call it is an already-settled promise, so `await processIcon` costs a microtask.

## Why it matters

The user has clicked something in a third-party desktop application — a wallet, an exchange client, anything embedding `@trezor/connect` with the `CoreInSuiteDesktop` transport — and is waiting for Suite's approval dialog to come up. On the current code, every call the app makes runs: websocket handshake → `lsof` → `ps` (or `netstat` → PowerShell) → handshake reply → `CORE_CALL` → OS thumbnail → only then `connect-popup/call` reaches the renderer and the dialog can render.

`n` is the number of core calls over one websocket session, and it is unbounded: a single connected app typically issues `getFeatures`, `getPublicKey`, `getAddress`, `signTransaction` back to back, and a long-lived integration keeps calling for as long as it is open. The per-call work is constant but expensive and constant in the wrong place — the answer is identical every time, because `req.socket.remotePort` ([`:95`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/connect-ws.ts#L95)) names one socket, and a socket belongs to one process for its whole life.

Two things make it worse than "some latency on the first call":

- **It is paid even when no dialog appears.** The lookup sits in the handshake, before the main process knows whether the renderer will show anything. Once the user has ticked "remember" for an app, subsequent calls skip the permissions modal entirely — [`permissions.test.ts:44`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/tests/trezor-connect/permissions.test.ts#L44) exercises exactly that flow — but they still spawn both subprocesses and re-extract the icon.
- **It is paid against a 3 s deadline.** `handshake()` is given `timeout: 3000`; if the two spawns overrun it on a loaded machine, the client throws `Desktop_ConnectionMissing` and the call fails outright. After the change only the first handshake of a connection is exposed to that budget; every later one is a bare round trip. That is a reliability improvement, not only a latency one.

After the fix, a session's `k` calls pay one lookup and one thumbnail instead of `k` of each, and the thumbnail no longer sits between the `CORE_CALL` arriving and the dialog being asked for.

## Notes

- **This is not a long-task finding, and the document should not be read as one.** `spawn` and `createThumbnailFromPath` are both asynchronous; nothing here holds the main thread for 50 ms of straight-line JavaScript. Process creation itself (`uv_spawn`) does run on the event loop thread, so the spawns are not entirely free to the main process, but the dominant cost is **added serial latency in front of a user-visible dialog**, not a blocking period. The fix is a cache, which belongs to `skills/performance-complexity/SKILL.md`; only the "start the decorative icon early instead of awaiting it in the payload" half is a scheduling change. A reviewer who wants this re-filed under the complexity sweep is right on classification, and it changes nothing about the diff.
- **Security: the cached value feeds an authorisation display, so keying matters.** `processOnPort.warning` becomes the "unusual binary location" badge ([`ConnectProcessLabel.tsx:20`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/ConnectProcessLabel.tsx#L20)), and `name`/`fullPath` are what the user reads before granting a permission. The cache is keyed by the connection closure, which is the right key: a different peer means a different socket means a fresh closure and a fresh lookup. Re-running the discovery per call buys no additional guarantee — the peer of an established socket cannot change — but a reviewer who believes the repetition was deliberate defence-in-depth should say so explicitly, because nothing in the code or comments says it was.
- **A failed lookup is deliberately not cached.** `if (processOnPort) return;` means a transient `lsof` failure is retried on the next handshake, preserving today's behaviour. This matters more than it looks: on macOS and Windows a missing `processOnPort` makes the `CORE_CALL` branch `return` at [`:168`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/connect-ws.ts#L168) without ever replying, and the client's `CORE_CALL` has `timeout: 0` ([`core-in-suite-desktop.ts:148`](https://github.com/trezor/trezor-suite/blob/develop/packages/connect-web/src/impl/core-in-suite-desktop.ts#L148)), so the caller waits forever. That silent hang is a pre-existing bug this document does not fix and deliberately does not touch; caching the failure would have made it permanent for the connection, which is why the memo stores successes only. Linux already tolerates the absent value by design ([`:166`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/connect-ws.ts#L166), the AppImage/Flatpak carve-out).
- **On Linux the icon half is a no-op.** `getProcessIcon` returns `undefined` immediately for anything that is not Windows or macOS, so only those two platforms pay the thumbnail.
- **The icon is computed and then thrown away in the warning case.** `ConnectProcessLabel` returns the warning badge at [`:20`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/ConnectProcessLabel.tsx#L20) before it ever reads `process.icon` ([`:33`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/ConnectProcessLabel.tsx#L33)), so for any binary outside `/Applications` — which is every dev build, every Homebrew binary, and the `node` process the e2e suite uses — the thumbnail is pure waste. Skipping it with `processOnPort.warning ? undefined : getProcessIcon(…)` is a one-line further win. It is left out of the `After` on purpose: it couples the main process to a current rendering decision in `ConnectProcessLabel`, and if that component later shows an icon next to the warning the coupling breaks silently.
- **The more aggressive variant, and why it is not proposed.** The remote port is known at [`:95`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/connect-ws.ts#L95), so the lookup could start in `wss.on('connection')` ([`:92`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/libs/connect-ws.ts#L92)) and overlap the client's handshake round trip, removing it from the first call's critical path too. It is not in the `After` because it would spawn `lsof` for every loopback connection to `/connect-ws`, including ones that never handshake. If a reviewer is comfortable with that, it is a strictly better version of hunk 1.
- **The scan's other proposal — pushing the icon to the renderer as a follow-up message — is deliberately not taken.** It would need a new channel in `@trezor/suite-desktop-api` (alongside [`api.ts:95`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-api/src/api.ts#L95)), an update path through `connectPopupCallThunk` and the `ConnectProcessInfo` in the store ([`connectPopupTypes.ts:31`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/connect-popup/src/connectPopupTypes.ts#L31)), and a renderer that tolerates a late-arriving icon. That is a lot of surface for a 48×48 badge that already has a fallback glyph ([`ConnectProcessLabel.tsx:36`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/ConnectProcessLabel.tsx#L36)). Starting the thumbnail at handshake time gets most of the benefit for three lines.
- **Manifest parsing stays per handshake.** Only the process lookup is memoised. `manifest`, `version` and `requestedPermissions` come from the handshake payload and a client may legitimately re-`init` with different settings, so re-parsing them every time is correct and cheap.
- **Nothing the user can notice gets deferred past a point of no return.** The dialog content is unchanged: name, path and warning are resolved before the handshake reply, exactly as today. The only thing that can arrive later than before is nothing at all — `await processIcon` still blocks the payload; it just usually has nothing left to wait for.
- **Tests.** There is no `connect-ws.test.ts` — `packages/suite-desktop-core/src/libs/` has unit tests only for `app-utils`, `http-receiver`, `logger`, `parseCustomFeedURL`, `process-switches` and `user-data`. The nearest coverage is [`mcp-server.test.ts:45`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite-desktop-core/src/modules/mcp-server.test.ts#L45), which already mocks `getProcessIcon`, and the e2e that would catch a regression is [`permissions.test.ts:44`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/tests/trezor-connect/permissions.test.ts#L44), asserting the process name over three `getAddress` calls on one connection — caching keeps that identical, since all three come from the same peer. Note the e2e runs with `PLAYWRIGHT_RUN` set ([`suite/e2e/support/electron.ts:102`](https://github.com/trezor/trezor-suite/blob/develop/suite/e2e/support/electron.ts#L102)), which flips `filterSelf`; that flag is constant for a run, so it is unaffected by the memo.
- **The `After` has not been compiled.** It is written against the real types by reading. The one thing worth a compiler's opinion is the narrowing of `processOnPort` inside `resolvePeerProcess` after the early return.
- **Packaging.** `@trezor/suite-desktop-core` and `@trezor/node-utils` are both `"private": true`, so there is no published-API impact, and no dependency is added. This document needs neither `yieldToMain` nor `runWhenIdle` — it is the one item in this sweep where the shared helpers are irrelevant.
- **Where to push back first.** Whether this is worth a PR at all depends on how many calls a real integration makes per session. If the common case is genuinely one call and then idle, the whole win collapses to "the icon starts a round trip earlier", which is not much. The counter-argument is `mcp-server.ts`, which decided the same question the other way in the same package — but that is an argument from consistency, not from a measurement, and this document has none.

<sub>Verified against `develop` at `77d47ea064`. Part of #28886.</sub>
