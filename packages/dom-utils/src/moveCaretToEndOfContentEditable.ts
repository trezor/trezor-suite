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
