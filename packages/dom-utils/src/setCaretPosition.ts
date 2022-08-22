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
