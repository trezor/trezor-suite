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

/**
 * Returns string if there is an error, otherwise returns true
 */
export const copyToClipboard = (
    value: string,
    parent: HTMLDivElement | HTMLPreElement | HTMLButtonElement | null,
) => {
    try {
        const container = parent || document.body;
        const el = document.createElement('textarea');
        el.value = value;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        container.appendChild(el);
        el.select();
        el.setSelectionRange(0, 99999); /* For mobile devices */
        const successful = document.execCommand('copy');
        if (!successful) {
            throw new Error('Copy command unsuccessful');
        }
        container.removeChild(el);
        return true;
    } catch (error) {
        return error.message;
    }
};

export const download = (value: string, filename: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(value)}`);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};

/**
 * When focusing content editable element, caret appears at the begging of string it contains.
 * We need to move it to the end.
 * Solution from https://stackoverflow.com/questions/36284973/set-cursor-at-the-end-of-content-editable
 */
export const moveCaretToEndOfContentEditable = (contentEditableElement: HTMLElement) => {
    let range;
    let selection;
    if (document.createRange) {
        range = document.createRange(); // Create a range (a range is a like the selection but invisible)
        range.selectNodeContents(contentEditableElement); // Select the entire contents of the element with the range
        range.collapse(false); // collapse the range to the end point. false means collapse to end rather than the start
        selection = window.getSelection(); // get the selection object (allows you to change selection)
        if (selection) {
            selection.removeAllRanges(); // remove any selections already made
            selection.addRange(range); // make the range you have just created the visible selection
        }
    }
};

/**
 * Use this function to position caret in input element
 * @param el - input element ref
 * @param pos - index of value in el where caret should be positioned
 */
export const setCaretPosition = (el: HTMLInputElement, pos: number) => {
    if (el.setSelectionRange) {
        el.focus();
        el.setSelectionRange(pos, pos);
    }
};
