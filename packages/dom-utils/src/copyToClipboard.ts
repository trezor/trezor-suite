/**
 * Returns string if there is an error, otherwise returns true
 */
export const copyToClipboard = (value: string) => {
    try {
        navigator.clipboard.writeText(value);

        return true;
    } catch (error) {
        return error.message;
    }
};
