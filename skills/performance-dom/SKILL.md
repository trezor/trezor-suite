---
name: performance-dom
description: Browser rendering performance for Trezor Suite — forced synchronous layout from geometry reads, observer APIs instead of measuring an element, and transitioning only compositor properties. Use when measuring, scrolling or animating a DOM element, or when writing a CSS transition. Web and desktop only.
---

# DOM Manipulation and CSS Properties

Reads that force the browser to lay out again mid-frame, and animations that make it lay out on every
frame. Web and desktop only — `suite-native` renders through React Native and has no DOM to force. Both
rules here have a mechanizable half that belongs in lint rather than in prose, and each says which.

## Optimize DOM reads and writes, and never interleave them

A geometry read costs nothing while style and layout are clean, and forces a synchronous style + layout
pass whenever anything has invalidated them — your own style write, a class toggle, an inserted node, or
React's commit. One forced pass is affordable; one per row down a long list is the whole problem. So the
defect is the repetition and the interleaving, not the call: take every read you need, then write, and
keep both out of a `.map()` or a per-row component.

```ts
// bad - collapse.tsx:37 - line two re-reads the clientWidth that line one's write just invalidated
inner.style.width = `${inner.clientWidth}px`;
container.style.width = `${inner.clientWidth}px`;

// good - one read, then the writes
const innerWidth = inner.clientWidth;

inner.style.width = `${innerWidth}px`;
container.style.width = `${innerWidth}px`;
```

The reads are `getBoundingClientRect`, `offset*`, `client*`, `scroll*`, `innerText` and `getComputedStyle`
([Paul Irish's gist](https://gist.github.com/paulirish/5d52fb081b3570c81e3a) has the full set).
`getComputedStyle` is the one that gets missed: it forces layout when the queried property is
layout-dependent or the document carries viewport media queries, which Suite's does — that is
`HiddenPlaceholder.tsx:82`, reading `font-size` in a `useLayoutEffect` on every instance, and no observer
can supply it. Derive the blur from `em` or a theme token instead and the read disappears.

Where geometry _can_ come from an observer, take it there: an `IntersectionObserver` or `ResizeObserver`
callback runs after layout, so reading in it is free — [`useAnchor.ts:25`](../../suite/router/src/useAnchor.ts)
is the worked example. `requestAnimationFrame` is not the same tool. Its callback runs _before_ style and
layout, so a read there is cheap only because the previous frame's layout is still valid, and a write
there forces layout exactly as it would anywhere else. `ExpandableAssetRowTokens.tsx:56` wraps a
`setState` in rAF to "ask for fresh frame before switching the state"; rAF grants no such thing.

That blind spot is the argument for mechanizing the ban rather than counting by hand: a
`no-restricted-properties` entry in
[`javascriptConfig.mjs`](../../packages/eslint/src/javascriptConfig.mjs) sees the destructured form, and
an [`eslint-local-rules`](../../eslint-local-rules/rules.ts) rule can carry the "outside an observer"
qualifier that a selector cannot. Only the interleaving and the per-row repetition need a human.

## Transition compositor properties, and never leave the property unnamed

`width`, `height`, `top`, `margin` and `min-width` re-run layout on every frame of the animation;
`transform`, `opacity` and `filter` are composited and do not. `transition: all` is the same defect with
nothing named — and so is the bare-duration shorthand, because an omitted `transition-property` resets to
`all`.

```tsx
// bad - ProgressBar.tsx:22 - lays out the bar every frame for half a second
width: ${({ $max, $value }) => `calc((100% / ${$max}) * ${$value})`};
transition: width 0.5s;

// good - laid out once at full width, then scaled
width: 100%;
transform-origin: left;
transform: scaleX(${({ $max, $value }) => $value / $max});
transition: transform 0.5s;
```

`transform-origin` is load-bearing: the default origin is the centre, so without it every bar in the app
grows from its middle. Scale is also the weakest case for `transform` — a scale change re-rasters unless
`will-change: transform` pins the texture, and then it stretches a bitmap — so it is safe for a solid
childless fill like this one and wrong for a pill-shaped or labelled bar, where it distorts the radius and
the text. Translation and opacity are the genuinely composite-only changes.

## Related skills

- [Asymptotic complexity](../performance-complexity/SKILL.md) — indexing, sorting and reducing over
  collections that grow.
- [React hooks](../performance-react-hooks/SKILL.md) — memoization, dependency arrays, render loops.
- [Long and non-essential tasks](../performance-scheduling/SKILL.md) — yielding long tasks, deferring
  background work.
