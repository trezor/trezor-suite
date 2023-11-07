export const addDashesToSpaces = (inputString: string): string =>
    // Use a regular expression to replace spaces with dashes
    inputString.replace(/\s+/g, '-');
