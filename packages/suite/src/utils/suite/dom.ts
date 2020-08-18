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

export const copyToClipboard = (value: string, parent: HTMLDivElement | HTMLPreElement | null) => {
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

export const download = (value: string, filename: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(value)}`);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};
