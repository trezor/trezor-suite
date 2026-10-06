/**
 * Returns string if there is an error, otherwise returns true
 */
export const copyToClipboard = async (value: string) => {
    try {
        await navigator.clipboard.writeText(value);

        return true;
    } catch (error) {
        return error.message;
    }
};
