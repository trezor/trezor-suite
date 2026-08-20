Asset picker wraps the expand toggle in a rAF that only adds a frame of latency

Extracted from the `skills/performance-dom/SKILL.md` audit — section _"Optimize DOM reads and
writes, and never interleave them"_, which names this exact site:

> `requestAnimationFrame` is not the same tool. Its callback runs _before_ style and layout …
> `ExpandableAssetRowTokens.tsx:56` wraps a `setState` in rAF to "ask for fresh frame before
> switching the state"; rAF grants no such thing.

(The anchor has since drifted by one line to `:57`.)

## Where

[`packages/suite/src/components/suite/asset-picker/components/AssetRow/ExpandableAssetRowTokens/ExpandableAssetRowTokens.tsx:54-61`](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/components/suite/asset-picker/components/AssetRow/ExpandableAssetRowTokens/ExpandableAssetRowTokens.tsx#L54-L61)

## Before

```tsx
<Collapsible.Toggle
    onClick={() => {
        // The operation will be probably expensive. Ask for fresh frame before switching the state.
        requestAnimationFrame(() => {
            onExpandToggle(account.key, !expanded);
        });
    }}
>
```

## After

```tsx
<Collapsible.Toggle onClick={() => onExpandToggle(account.key, !expanded)}>
```

## Why it matters

A rAF callback runs at the **top** of the next frame, before style and layout — so the expensive
state switch and the token-row render still execute inside that frame, exactly as they would
have inside the click task. The comment's premise ("ask for fresh frame") is the misconception
the skill exists to correct: the only observable effect is one extra frame (~16 ms) of input
latency on the asset-picker expand — an interaction #30497 already traced as a 140 ms long task.
If the intent was to paint the toggle's own feedback before the heavy row render, that is a
scheduling-skill tool (`startTransition` around the expand state), not rAF.

## Notes

- The rest of this file is the **good** pattern and worth protecting in review: `:14-22` sets a
  *computed* content height in one step (`getExpandableTokensContentHeight(tokens.length)`, no
  measurement) and transitions only `opacity` with `will-change` — the comment there even
  documents why `Collapsible.Content`'s height animation was avoided.
- The actual expense of the expand (rendering `AssetRowToken` rows) is real; if it needs fixing
  it belongs to the scheduling/react-hooks families. This issue only removes the no-op rAF —
  smallest possible diff, pure latency win.
- Sibling-draft check: `../react-hooks` and `../scheduling` touch the asset picker's search and
  sidebar filtering, not this toggle. No overlap.

<sub>Verified against `issues/perf-performance-dom` at `1eacf16b1d`. Part of #28886, belongs under #30497.</sub>
