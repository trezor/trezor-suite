const textFromMutation = (mutation: MutationRecord, isIgnored: (node: Node) => boolean) => {
    if (isIgnored(mutation.target)) return '';

    if (mutation.type === 'characterData') return mutation.target.textContent ?? '';

    if (mutation.type !== 'childList') return '';

    return [...mutation.addedNodes]
        .filter(node => !isIgnored(node))
        .map(node => node.textContent ?? '')
        .join('');
};

// Chromium only highlights DOM that existed when the search ran.
export const addedTextContainsFindQuery = (
    mutations: MutationRecord[],
    query: string,
    isIgnored: (node: Node) => boolean,
): boolean => {
    if (query.length === 0) return false;

    const addedText = mutations
        .map(mutation => textFromMutation(mutation, isIgnored))
        .join('')
        .toLowerCase();

    return addedText.includes(query.toLowerCase());
};
