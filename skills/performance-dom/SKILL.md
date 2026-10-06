---
name: performance-dom
description: Browser rendering performance for Trezor Suite — forced synchronous layout from geometry reads, observer APIs instead of measuring an element, and transitioning only compositor properties. Use when measuring, scrolling or animating a DOM element, or when writing a CSS transition. Web and desktop only.
---

# DOM Manipulation and CSS Properties

Reads that force the browser to lay out again mid-frame, and animations that make it lay out on every
frame. Web and desktop only.

## Optimize DOM reads and writes, and never interleave them

All of the below properties or methods, when requested/called in JavaScript, will trigger the browser to synchronously calculate the style and layout*. This is also called reflow or layout thrashing, and is common performance bottleneck.

Generally, all APIs that synchronously provide layout metrics will trigger forced reflow / layout. Read on for additional cases and details

Getting box metrics

- `elem.offsetLeft`, `elem.offsetTop`, `elem.offsetWidth`, `elem.offsetHeight`, `elem.offsetParent`
- `elem.clientLeft`, `elem.clientTop`, `elem.clientWidth`, `elem.clientHeight`
- `elem.getClientRects()`, `elem.getBoundingClientRect()`

Scroll stuff

- `elem.scrollBy()`, `elem.scrollTo()`
- `elem.scrollIntoView()`, `elem.scrollIntoViewIfNeeded()`
- `elem.scrollWidth`, `elem.scrollHeight`
- `elem.scrollLeft`, `elem.scrollTop` also, setting them

- `elem.focus()` ([source](https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/dom/element.cc;l=4206-4225;drc=d685ea3c9ffcb18c781bc3a0bdbb92eb88842b1b))

- `elem.computedRole`, `elem.computedName`
- `elem.innerText` ([source](https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/editing/element_inner_text.cc;l=462-468;drc=d685ea3c9ffcb18c781bc3a0bdbb92eb88842b1b))

- `window.scrollX`, `window.scrollY`
- `window.innerHeight`, `window.innerWidth`
- window.visualViewport.height / width / offsetTop / offsetLeft ([source](https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/frame/visual_viewport.cc;l=435-461;drc=a3c165458e524bdc55db15d2a5714bb9a0c69c70?originalUrl=https:%2F%2Fcs.chromium.org%2F))

- `document.scrollingElement` only forces style
- `document.elementFromPoint`

- `inputElem.focus()`
- `inputElem.select()`, `textareaElem.select()`

- `mouseEvt.layerX`, `mouseEvt.layerY`, `mouseEvt.offsetX`, `mouseEvt.offsetY` ([source](https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/events/mouse_event.cc;l=476-487;drc=52fd700fb07a43b740d24595d42d8a6a57a43f81))

`window.getComputedStyle()` will typically force style recalc.

`window.getComputedStyle()` will often force layout, as well.

Details of the conditions where gCS() forces layout

`window.getComputedStyle()` will force layout in one of 3 conditions:

1. The element is in a shadow tree
2. There are media queries (viewport-related ones). Specifically, one of the following: ([source](https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/css/media_query_exp.cc;l=240-256;drc=4c8db70889f2d2fae8338b16f553c646dd20bf78)
    - `min-width`, `min-height`, `max-width`, `max-height`, `width`, `height`
    - `aspect-ratio`, `min-aspect-ratio`, `max-aspect-ratio`
    - `device-pixel-ratio`, `resolution`, `orientation` , `min-device-pixel-ratio`, `max-device-pixel-ratio`
3. The property requested is one of the following: ([source](https://source.chromium.org/chromium/chromium/src/+/master:third_party/blink/renderer/core/css/properties/css_property.h;l=69;drc=d685ea3c9ffcb18c781bc3a0bdbb92eb88842b1b))
    - `height`, `width`
    - `top`, `right`, `bottom`, `left`
    - `margin` [`-top`, `-right`, `-bottom`, `-left`, or _shorthand_] only if the margin is fixed.
    - `padding` [`-top`, `-right`, `-bottom`, `-left`, or _shorthand_] only if the padding is fixed.
    - `transform`, `transform-origin`, `perspective-origin`
    - `translate`, `rotate`, `scale`
    - `grid`, `grid-template`, `grid-template-columns`, `grid-template-rows`
    - `perspective-origin`
    - These items were previously in the list but appear to not be any longer (as of Feb 2018): `motion-path`, `motion-offset`, `motion-rotation`, `x`, `y`, `rx`, `ry`

- `range.getClientRects()`, `range.getBoundingClientRect()`

### SVG

Quite a lot of properties/methods force. This list in incomplete:

- SVGLocatable: `computeCTM()`, `getBBox()`
- SVGTextContent: `getCharNumAtPosition()`, `getComputedTextLength()`, `getEndPositionOfChar()`, `getExtentOfChar()`, `getNumberOfChars()`, `getRotationOfChar()`, `getStartPositionOfChar()`, `getSubStringLength()`, `selectSubString()`
- SVGUse: `instanceRoot`

- Lots & lots of stuff, including copying an image to clipboard ([source](https://source.chromium.org/search?q=UpdateStyleAndLayout%20-f:test&ss=chromium%2Fchromium%2Fsrc:third_party%2Fblink%2Frenderer%2Fcore%2Fediting%2F))

[Source](https://gist.githubusercontent.com/paulirish/5d52fb081b3570c81e3a/raw/6e6fd7096c505d3b536f0612f3dc91a9dec97302/what-forces-layout.md)

```ts
// bad - collapse.tsx:37 - line two re-reads the clientWidth that line one's write just invalidated
inner.style.width = `${inner.clientWidth}px`;
container.style.width = `${inner.clientWidth}px`;

// good - one read, then the writes
const innerWidth = inner.clientWidth;

inner.style.width = `${innerWidth}px`;
container.style.width = `${innerWidth}px`;
```

- Where geometry _can_ come from an observer, take it there: an `IntersectionObserver` or `ResizeObserver`
  callback runs after layout, so reading in it is cheap (example: [`useAnchor.ts:25`](../../suite/router/src/useAnchor.ts)).
- `requestAnimationFrame` requests the browser to call a user-supplied callback function before the next repaint.

## Transition compositor properties, and never leave the property unnamed

- `width`, `height`, `top`, `margin` and `min-width` re-run layout on every frame of the animation
- `transform`, `opacity` are composited and do not.
- `transition: all` is the same defect with nothing named — and so is the bare-duration shorthand, because an omitted `transition-property` resets to `all`.

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

- `transform-origin` is load-bearing: the default origin is the centre, so without it every bar in the app
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
