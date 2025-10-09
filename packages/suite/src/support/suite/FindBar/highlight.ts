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

export const highlightText = (root: HTMLElement, query: string): number => {
    removeHighlights(root);
    if (!query.trim()) return 0;

    const regex = new RegExp(escapeRegExp(query), 'gi');
    let count = 0;
    let ordinal = 0;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);

    for (const textNode of nodes) {
        try {
            const text = textNode.textContent;
            const parent = textNode.parentElement;

            if (
                !text ||
                !parent ||
                parent.closest('[data-no-highlight], [contenteditable="true"]') ||
                !isVisible(parent)
            ) {
                continue;
            }

            const matches = [...text.matchAll(regex)];
            if (matches.length === 0) continue;

            const frag = document.createDocumentFragment();
            let lastIndex = 0;

            for (const match of matches) {
                const start = match.index ?? 0;
                const end = start + match[0].length;

                if (start > lastIndex) {
                    frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
                }

                const mark = document.createElement('mark');
                mark.textContent = text.slice(start, end);
                mark.className = 'find-highlight';
                mark.setAttribute('data-find-ordinal', String(ordinal++));
                frag.appendChild(mark);
                count++;
                lastIndex = end;
            }

            if (lastIndex < text.length) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex)));
            }
            textNode.replaceWith(frag);
        } catch (e) {
            console.warn('Skipped find highlight', e);
        }
    }

    return count;
};
