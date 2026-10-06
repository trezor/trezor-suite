export const canShareAddress = () =>
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export const shareAddress = (address: string) => navigator.share({ text: address }).catch(() => {});
