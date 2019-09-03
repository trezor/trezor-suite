export const selectText = (element: HTMLElement) => {
    const doc = document;
    if (window.getSelection) {
        const selection = window.getSelection();
        if (selection) {
            const range = doc.createRange();
            range.selectNodeContents(element);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
};
