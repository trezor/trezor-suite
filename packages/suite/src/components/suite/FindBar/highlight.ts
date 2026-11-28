import { NO_HIGHLIGHT_ATTRIBUTE } from './consts';

const FIND_MATCH_HIGHLIGHT = 'find-match';
const FIND_CURRENT_HIGHLIGHT = 'find-current';

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Ranges stay outside the DOM, so React still owns its text nodes.
let matchRanges: Range[] = [];

const isVisible = (el: Element): boolean =>
    el instanceof HTMLElement &&
    el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) &&
    !el.hasAttribute('hidden');

const collectTextNodes = (root: HTMLElement): Text[] => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];

    while (walker.nextNode()) {
        nodes.push(walker.currentNode as Text);
    }

    return nodes;
};

const clearHighlight = (name: string) => {
    CSS.highlights.delete(name);
};

export const removeHighlights = () => {
    matchRanges = [];
    clearHighlight(FIND_MATCH_HIGHLIGHT);
    clearHighlight(FIND_CURRENT_HIGHLIGHT);
};

export const highlightText = (root: HTMLElement, query: string): number => {
    removeHighlights();
    const trimmed = query.trim();
    if (!trimmed) return 0;

    const regex = new RegExp(escapeRegExp(trimmed), 'gi');
    const ranges: Range[] = [];

    collectTextNodes(root).forEach(textNode => {
        const text = textNode.textContent;
        const parent = textNode.parentElement;
        if (
            !text ||
            !parent ||
            parent.closest(`[${NO_HIGHLIGHT_ATTRIBUTE}], [contenteditable="true"]`) ||
            !isVisible(parent)
        ) {
            return;
        }

        Array.from(text.matchAll(regex)).forEach(match => {
            const start = match.index ?? 0;
            const range = document.createRange();
            range.setStart(textNode, start);
            range.setEnd(textNode, start + match[0].length);
            ranges.push(range);
        });
    });

    matchRanges = ranges;
    if (ranges.length > 0) {
        const highlight = new Highlight();
        ranges.forEach(range => highlight.add(range));
        CSS.highlights.set(FIND_MATCH_HIGHLIGHT, highlight);
    }

    return ranges.length;
};

export const setActiveFindMatch = (ordinal: number | null): boolean => {
    clearHighlight(FIND_CURRENT_HIGHLIGHT);
    if (ordinal === null) return false;

    const range = matchRanges[ordinal];
    if (!range) return false;

    const highlight = new Highlight(range);
    highlight.priority = 1;
    CSS.highlights.set(FIND_CURRENT_HIGHLIGHT, highlight);

    return true;
};

export const scrollFindMatchIntoView = (ordinal: number) => {
    matchRanges[ordinal]?.startContainer.parentElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
    });
};
