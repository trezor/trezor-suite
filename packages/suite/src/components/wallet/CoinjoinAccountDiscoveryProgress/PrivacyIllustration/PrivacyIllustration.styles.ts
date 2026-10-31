import styled from 'styled-components';

import { getIllustrationColors } from './getIllustrationColors';
import { VIEW_HEIGHT, VIEW_WIDTH } from './illustrationGeometry';

// The theme comes in as CSS variables, so switching it restyles the SVG without touching paths.
export const IllustrationFrame = styled.div`
    position: relative;
    width: 100%;
    max-width: ${VIEW_WIDTH}px;
    height: ${VIEW_HEIGHT}px;
    overflow: hidden;

    ${({ theme }) => {
        const colors = getIllustrationColors(theme);

        return `
            --art-card: ${colors.card};
            --art-ink: ${colors.ink};
            --art-label: ${colors.label};
            --art-box-stroke: ${colors.boxStroke};
            --art-screen-tint: ${colors.screenTint};
            --art-violet: ${colors.violet};
            --art-violet-text: ${colors.violetText};
            --art-keep: ${colors.keep};
            --art-ember: ${colors.ember};
            --art-spark: ${colors.spark};
            --art-wire-alpha: ${colors.wireAlpha};
            --art-relay-alpha: ${colors.relayAlpha};
            --art-glyph-alpha: ${colors.glyphAlpha};
            --art-cell-alpha: ${colors.cellAlpha};
            --art-pill-alpha: ${colors.pillAlpha};
            --art-ash-alpha: ${colors.ashAlpha};
            --art-ember-alpha: ${colors.emberAlpha};
            --art-violet-glow-alpha: ${colors.violetGlowAlpha};
            --art-keep-soft-alpha: ${colors.keepSoftAlpha};
            --art-separator-alpha: ${colors.separatorAlpha};
        `;
    }}

    /* Two stacked layers with one viewBox: the static tangle is rasterised once on its own layer,
    only the small dynamic layer above it is repainted while animating. */
    > svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        will-change: transform;
    }

    text {
        font-size: 12px;
        font-weight: 500;
        fill: var(--art-label);
        paint-order: stroke;
        stroke: var(--art-card);
        stroke-width: 5px;
        stroke-linejoin: round;
    }

    .art-violet-text {
        fill: var(--art-violet-text);
    }

    .art-wire {
        fill: none;
        stroke-linecap: round;
    }

    .art-relay {
        fill: var(--art-card);
    }

    .art-outline {
        fill: var(--art-card);
        stroke: var(--art-ink);
        stroke-opacity: var(--art-glyph-alpha);
    }

    .art-glyph-line {
        fill: none;
        stroke: var(--art-ink);
        stroke-opacity: var(--art-glyph-alpha);
    }

    .art-glyph-fill {
        fill: var(--art-ink);
        fill-opacity: var(--art-glyph-alpha);
    }

    .art-card-fill {
        fill: var(--art-card);
    }

    .art-screen {
        fill: var(--art-screen-tint);
        stroke: var(--art-ink);
        stroke-opacity: var(--art-glyph-alpha);
    }

    .art-box {
        fill: var(--art-screen-tint);
        stroke: var(--art-box-stroke);
    }

    .art-box-header {
        fill: var(--art-box-stroke);
    }

    .art-cell {
        fill: var(--art-ink);
        fill-opacity: var(--art-cell-alpha);
    }

    .art-ember {
        fill: var(--art-ember);
        fill-opacity: var(--art-ember-alpha);
    }

    .art-ash {
        fill: var(--art-ink);
        fill-opacity: var(--art-ash-alpha);
    }

    .art-spark {
        fill: var(--art-spark);
    }

    .art-check-line {
        stroke: var(--art-spark);
    }

    .art-pill {
        fill: var(--art-ink);
        fill-opacity: var(--art-pill-alpha);
    }

    .art-separator {
        stroke: var(--art-ink);
        stroke-opacity: var(--art-separator-alpha);
    }

    .art-violet {
        fill: var(--art-violet);
    }

    .art-violet-line {
        fill: none;
        stroke: var(--art-violet);
    }

    .art-violet-glow {
        stroke-opacity: var(--art-violet-glow-alpha);
    }

    .art-keep {
        fill: var(--art-keep);
        stroke: none;
    }

    .art-keep-soft {
        fill: var(--art-keep);
        fill-opacity: var(--art-keep-soft-alpha);
        stroke: var(--art-keep);
    }

    .art-keep-ring {
        fill: none;
        stroke: var(--art-keep);
        stroke-width: 1.3px;
    }

    .art-ash-ring {
        fill: none;
        stroke: var(--art-ink);
        stroke-opacity: var(--art-ash-alpha);
        stroke-width: 1.3px;
    }
`;
