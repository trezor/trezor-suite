Extracted from the `skills/performance-react-hooks/SKILL.md` audit — section _"Keep hook dependencies
referentially stable"_. Found by sweep, not named in the doc.

## Where

[`packages/components/src/components/Menu/Menu.tsx:131`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Menu/Menu.tsx#L131)
(unmemoized `.filter()`)

- Both effects depend on it: [`:137-160`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Menu/Menu.tsx#L137-L160)
  (select-on-Enter/Space) and [`:163-195`](https://github.com/trezor/trezor-suite/blob/develop/packages/components/src/components/Menu/Menu.tsx#L163-L195)
  (arrow-key navigation).

## Before

```tsx
// Menu.tsx:128-134
export const Menu = forwardRef<HTMLUListElement, MenuProps>(
    ({ items, content, onClose, ...rest }, ref) => {
        const frameProps = pickAndPrepareFrameProps(rest, allowedMenuFrameProps);
        const visibleItems = items?.filter(item => !item.isHidden);
        const [focusedItemIndex, setFocusedItemIndex] = useState(
            visibleItems?.length ? visibleItems.findIndex(item => !item.isDisabled) : null,
        );

        // handle selecting an item
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (!visibleItems?.length || focusedItemIndex === null) {
                    return;
                }

                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();

                    const focusedItem = visibleItems[focusedItemIndex];

                    if (focusedItem?.closeOnClick !== false) onClose?.();
                    focusedItem?.onClick?.();
                }
            };

            if (focusedItemIndex !== null && visibleItems?.length) {
                document.addEventListener('keydown', handleKeyDown);

                return () => {
                    document.removeEventListener('keydown', handleKeyDown);
                };
            }
        }, [focusedItemIndex, visibleItems, onClose]);

        // handle keyboard navigation
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (
                    (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
                    visibleItems &&
                    visibleItems.length > 0 &&
                    focusedItemIndex !== null
                ) {
                    e.preventDefault();
                    let indexCandidate = focusedItemIndex;
                    const direction = e.key === 'ArrowUp' ? -1 : 1;
                    const getNextIndex = (index: number, dir: number) =>
                        (index + dir + visibleItems.length) % visibleItems.length;

                    do {
                        indexCandidate = getNextIndex(indexCandidate, direction);
                    } while (
                        visibleItems[indexCandidate]?.isDisabled &&
                        indexCandidate !== focusedItemIndex
                    );

                    setFocusedItemIndex(indexCandidate);
                }
            };

            if (focusedItemIndex !== null && visibleItems?.length) {
                document.addEventListener('keydown', handleKeyDown);

                return () => {
                    document.removeEventListener('keydown', handleKeyDown);
                };
            }
        }, [visibleItems, focusedItemIndex]);
```

`visibleItems` is a plain `.filter()` call in the render body — a new array every render regardless
of whether any item's `isHidden` flag actually changed. Both effects list it as a dependency, so
every render of an open `Menu` tears down and re-adds two separate `document`-level `keydown`
listeners, even when nothing about the visible items changed.

## After

```tsx
const visibleItems = useMemo(() => items?.filter(item => !item.isHidden), [items]);
```

## Why it matters

`Menu` backs essentially every dropdown/context menu in the app. While a menu is open, any re-render
of it (a parent state change, a prop update unrelated to `items`) currently causes two global
keyboard-listener teardown/rebuild cycles instead of zero; both effects would instead only re-run
when the actual visible-items set changes.

## Notes

- Compile requirement: add `useMemo` to the existing
  `import React, { forwardRef, useEffect, useState } from 'react';` on `Menu.tsx:1`.
- Bounded, not a loop: neither effect's own body sets state that feeds back into `visibleItems` or
  `items`, so this is wasted teardown/rebuild work, not a render or request cycle — no events are
  missed in practice, but the two listeners churn on every unrelated re-render of an open menu
  instead of only when `items` changes.
- `packages/components` ships to both the uncompiled `packages/suite` web/desktop app and the
  React-Compiler-covered `suite-native`; per this area's scope, native-vs-web doesn't change the fix
  — memoize for the web consumer.

<sub>Verified against `issues/perf-react-hooks` at 9e0d5b6a45. Part of #28886.</sub>
