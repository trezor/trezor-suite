export const getQueryVariable = (variable: string) => {
    const query = window.location.hash.substring(3);
    const vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const varEntry: string = vars[i];
        const pair = varEntry.split('=');
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const key: string = pair[0];
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const val: string = pair[1];
        if (decodeURIComponent(key) === variable) {
            return decodeURIComponent(val);
        }
    }
};
