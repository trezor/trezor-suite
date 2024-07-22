import { ClipboardEvent } from 'react';

export const handleOnCopy = (event: ClipboardEvent) => {
    const selectedText = window.getSelection()?.toString();

    if (selectedText) {
        const processedText = selectedText.replace(/\s/g, '');
        event?.nativeEvent?.clipboardData?.setData('text/plain', processedText);
        event.preventDefault();
    }
};
