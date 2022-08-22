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
