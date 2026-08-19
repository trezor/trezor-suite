Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Keep hook dependencies
referentially stable"_. Found by sweep, not named in the doc.

## Where

[`packages/components/src/components/VirtualizedList/VirtualizedList.tsx:126`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/VirtualizedList/VirtualizedList.tsx#L126)

- Chain: `handleScroll` ([`:149-203`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/VirtualizedList/VirtualizedList.tsx#L149-L203))
  depends on the memo (`:196`); the scroll-listener effect
  ([`:205-212`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/VirtualizedList/VirtualizedList.tsx#L205-L212))
  depends on `handleScroll`.
- Triggering caller (outside this area, cited as evidence):
  [`packages/suite/src/components/suite/asset-picker/components/AssetsList/AssetsList.tsx:27-28`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/asset-picker/components/AssetsList/AssetsList.tsx#L27-L28)

## Before

```tsx
// VirtualizedList.tsx:19-33 — debounce() closes over its own fresh `timeout` per call
function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number,
): (...args: Parameters<T>) => void {
    let timeout: TimerId | null = null;

    return (...args: Parameters<T>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}
```

```tsx
// VirtualizedList.tsx:126
const debouncedOnScrollEnd = useMemo(() => debounce(onScrollEnd, 1000), [onScrollEnd]);
```

```tsx
// AssetsList.tsx:27-28 — the only real consumer today (packages/suite, outside this area, cited as evidence)
const [end, setEnd] = useState(items.length);
const onScrollEnd = useCallback(() => setEnd(end + 1000), [end]);
```

`onScrollEnd`'s own dependency is the state it sets (`end`), so its identity changes every time it
fires. Recreating `debouncedOnScrollEnd` discards whatever debounce/timer bookkeeping the previous
`debounce()` instance was holding, and both `handleScroll` (depends on `debouncedOnScrollEnd` at
`:196`) and the scroll-listener effect (depends on `handleScroll`) re-run in turn — tearing down and
re-adding the `scroll` listener on the scrollable container.

## After

```tsx
import { useFreshRef } from '@trezor/react-utils';

// ...

const onScrollEndRef = useFreshRef(onScrollEnd);
const debouncedOnScrollEnd = useMemo(
    () => debounce(() => onScrollEndRef.current(), 1000),
    [onScrollEndRef],
);
```

`useFreshRef`'s returned ref object is stable for the component's lifetime (a plain `useRef` under
the hood), so this `useMemo` now runs once, `handleScroll`'s identity stops churning, and the scroll
listener is registered once instead of on every load-more trigger — while still always calling the
latest `onScrollEnd`.

## Why it matters

Every scroll-near-the-end event during a long scroll session through `VirtualizedList`'s one real
consumer today (the asset/coin picker, which can hold every network's tokens) currently tears down
and rebuilds the scroll subscription and the debounce timer, instead of the debounce staying stable
for the component's lifetime as its 1000 ms wait implies it should.

## Notes

- Compile requirement: `packages/components/package.json` does not currently list
  `@trezor/react-utils` as a dependency (checked) — add it as a workspace dependency. Both packages
  are same-layer `packages/*`, and `@trezor/react-utils` has no dependency back on
  `@trezor/components` (checked its `package.json`), so this doesn't cross the layering rule or
  create a cycle.
- Distinct from `perf-issues/asymptotic-complexity/p2-11-virtualizedlistx-virtualizedlistcomponent.md`
  (sibling draft, not yet filed): that doc fixes the O(w²) prefix-sum recomputation in the same file
  (`firstItemTop`/`itemTop` around lines 219-237) and the O(n) linear start-index scan at line 156 —
  an algorithmic-complexity defect that fires on every scroll event regardless of dependency
  stability. This doc fixes a different defect at a different line (`:126`) — the debounce/listener
  identity churning from an unstable callback crossing the component boundary. The two are
  independent and additive; landing one does not obsolete the other.
- Aside, not fixed here: `AssetsList.tsx` (`packages/suite`, outside this area) passes the _entire_
  `items` array to `VirtualizedList` regardless of `end`, so the `end`/`setEnd` state this defect
  defeats doesn't appear to gate anything today — that's a correctness/dead-code question for
  `packages/suite`, separate from the hooks-class defect documented here.
- `packages/components` ships to both the uncompiled `packages/suite` web/desktop app and the
  React-Compiler-covered `suite-native`; per this area's scope, native-vs-web doesn't change the fix
  — memoize for the web consumer.
- Honest sizing: bounded to "near the end of the list" scroll events (the `loadMoreBufferCount`
  threshold), not every scroll frame — real and reproducible with the sole current caller, but not a
  render loop.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
