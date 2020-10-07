import { useState, useEffect } from 'react';

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

export const useKeyPress = (targetKey: string) => {
    // State for keeping track of whether key is pressed
    const [keyPressed, setKeyPressed] = useState(false);

    // If pressed key is our target key then set to true
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const downHandler = (event: KeyboardEvent) => {
        if (event.key === targetKey) {
            setKeyPressed(true);
        }
    };

    // If released key is our target key then set to false
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const upHandler = (event: KeyboardEvent) => {
        if (event.key === targetKey) {
            setKeyPressed(false);
        }
    };

    // Add event listeners
    useEffect(() => {
        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);
        // Remove event listeners on cleanup
        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty array ensures that effect is only run on mount and unmount

    return keyPressed;
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
        el.focus();
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

export const useOnClickOutside = (
    elementRefs: React.MutableRefObject<HTMLElement | null>[],
    callback: (event: MouseEvent | TouchEvent) => void,
) => {
    useEffect(() => {
        if (!elementRefs?.length) return;
        const listener = (event: MouseEvent | TouchEvent) => {
            let clickInsideElements = false;

            elementRefs.forEach(elRef => {
                // Do nothing if clicking ref's element or descendent elements
                if (!elRef.current || elRef.current.contains(event.target as Node)) {
                    clickInsideElements = true;
                }
            });
            if (clickInsideElements) return;

            callback(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [elementRefs, callback]);
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
