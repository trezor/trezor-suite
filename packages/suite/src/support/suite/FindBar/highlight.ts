const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const removeHighlights = (root: HTMLElement) => {
    root.querySelectorAll('mark.find-highlight').forEach(mark => {
        const parent = mark.parentNode;
        if (!parent) return;
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
    });
};

const isVisible = (el: HTMLElement): boolean => {
    if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return false;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0')
        return false;

    return !el.hasAttribute('hidden');
};

const collectTextNodes = (root: HTMLElement): Text[] => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];

    while (walker.nextNode()) {
        nodes.push(walker.currentNode as Text);
    }

    return nodes;
};

export const highlightText = (root: HTMLElement, query: string): number => {
    removeHighlights(root);
    if (!query.trim()) return 0;

    const regex = new RegExp(escapeRegExp(query), 'gi');
    let count = 0;
    let ordinal = 0;

    const textNodes = collectTextNodes(root);

    const validNodes = textNodes.filter(textNode => {
        const text = textNode.textContent;
        const parent = textNode.parentElement;

        return (
            text &&
            parent &&
            !parent.closest('[data-no-highlight], [contenteditable="true"]') &&
            isVisible(parent)
        );
    });

    validNodes.forEach(textNode => {
        const text = textNode.textContent!;
        const matches = Array.from(text.matchAll(regex));
        if (matches.length === 0) return;

        const frag = document.createDocumentFragment();
        let lastIndex = 0;

        matches.forEach(match => {
            const start = match.index ?? 0;
            const end = start + match[0].length;

            if (start > lastIndex) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
            }

            const mark = document.createElement('mark');
            mark.textContent = text.slice(start, end);
            mark.className = 'find-highlight';
            mark.dataset.findOrdinal = String(ordinal++);
            frag.appendChild(mark);

            count++;
            lastIndex = end;
        });

        if (lastIndex < text.length) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        textNode.replaceWith(frag);
    });

    return count;
};
