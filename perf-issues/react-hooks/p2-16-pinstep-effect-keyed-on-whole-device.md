Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Minimal required
dependencies"_. Found by sweep, not named in the doc.

## Where

[`packages/suite/src/views/onboarding/steps/PinStep.tsx:49-70`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/onboarding/steps/PinStep.tsx#L49-L70)

## Before

```tsx
useEffect(() => {
    // This is where we detect requests from a device, figure out whether the PIN functionality got enabled,
    // and set a status of the setup process accordingly
    if (device?.features) {
        // enter-pin and repeat-pin" states are set only while working with T1B1 (T2T1 sends different request ButtonRequest_PinEntry and everything is done in touchscreen).
        // They are used to show better context-aware UI/texts (Right now it only changes a header from "Set a new PIN" to "Confirm PIN").
        // As the whole process on T2T1 is done via touchscreen we don't really need to track anything besides 'initial' and 'success' states.
        const buttonRequests = device.buttonRequests.map(r => r.code);
        if (buttonRequests.includes('PinMatrixRequestType_NewFirst')) {
            if (buttonRequests.includes('PinMatrixRequestType_NewSecond')) {
                setStatus('repeat-pin');
            } else {
                setStatus('enter-pin');
            }
        }

        if (device?.features.pin_protection) {
            setStatus('success');
            goToNextStep();
        }
    }
}, [device, goToNextStep]);
```

`device` is the whole `TrezorDevice` object from `useSelector(selectSelectedDevice)`, which gets a
fresh reference on any feature/state change, not just the two fields this effect actually branches
on. Nothing in the body guards against re-running the `pin_protection` branch once `status` is
already `'success'`.

## After

```tsx
const hasNewFirst = !!device?.buttonRequests.some(r => r.code === 'PinMatrixRequestType_NewFirst');
const hasNewSecond = !!device?.buttonRequests.some(
    r => r.code === 'PinMatrixRequestType_NewSecond',
);
const hasPinProtection = !!device?.features?.pin_protection;

useEffect(() => {
    // This is where we detect requests from a device, figure out whether the PIN functionality got enabled,
    // and set a status of the setup process accordingly
    if (!device?.features) return;

    if (hasNewFirst) {
        setStatus(hasNewSecond ? 'repeat-pin' : 'enter-pin');
    }

    if (hasPinProtection && status !== 'success') {
        setStatus('success');
        goToNextStep();
    }
}, [device?.features, hasNewFirst, hasNewSecond, hasPinProtection, status, goToNextStep]);
```

## Why it matters

`PinStep` keeps rendering (as `null`, via the `status === 'success'` check further down the
component) for as long as it stays mounted after PIN setup succeeds — the window until the parent's
`activeStepId`-keyed step switch
([`views/onboarding/index.tsx:56-88`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/views/onboarding/index.tsx#L56-L88))
swaps the rendered step component out. Depending on the whole `device` object means this effect
re-runs on any device-reference churn during that window, and as written nothing stops it from
calling `goToNextStep()` again on every one of those re-runs for as long as `pin_protection` stays
true. Narrowing the dependency array to the actual booleans already shrinks the re-run window to
genuine value transitions instead of incidental reference churn; adding the `status !== 'success'`
guard closes the remaining gap directly, so the branch that advances onboarding can fire at most
once per PIN setup regardless of how many device updates arrive afterward.

## Notes

- Compile requirement: none — `device?.buttonRequests`/`device?.features?.pin_protection` are
  already-accessible fields (`buttonRequests: ButtonRequest[]` is non-optional on the device type;
  only `device` itself and `device.features` are optional).
- The scan's own proposed fix narrows the dependency array but does not add the `status !== 'success'`
  guard; this doc adds it because the "Why it matters" risk (`goToNextStep()` re-invoked after
  success) is only fully closed once the effect is idempotent against being re-entered, not just
  less frequently triggered. Confirmed safe against a re-render loop: `setStatus('success')` inside
  the guarded branch flips `status` to the very value the guard checks, so the branch cannot re-fire
  on the next render it causes.
- `packages/suite` is not React-Compiler-covered, so this is a manual dependency-array fix, not a
  memoization one — `hasNewFirst`/`hasNewSecond`/`hasPinProtection` are already O(1)/cheap booleans
  derived in the render body, not something that itself needs `useMemo`.
- Whether the onboarding step reducer is idempotent against repeat "advance" dispatches was not
  traced; this fix removes the repeat-dispatch risk at its source regardless of that reducer's own
  behavior.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
