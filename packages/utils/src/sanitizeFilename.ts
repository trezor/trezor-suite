const MAX_FILENAME_LENGTH = 250;

export const sanitizeFilename = (filename: string, replacement = '_'): string | undefined => {
    if (!filename || filename.trim().length === 0) {
        return undefined;
    }

    // Illegal characters in filenames: < > : " / \ | ? *
    // Control codes: \x00-\x1F
    // https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file
    // https://stackoverflow.com/questions/1976007/what-characters-are-forbidden-in-windows-and-linux-directory-names
    // eslint-disable-next-line no-control-regex, no-useless-escape
    const illegalRe = /[<>:"\/\\|?*\x00-\x1F]/g;
    let safeName = filename.replace(illegalRe, replacement);

    // Truncate to avoid filesystem limits and potential regex DoS, just sanity check.
    if (safeName.length > MAX_FILENAME_LENGTH) {
        safeName = safeName.substring(0, MAX_FILENAME_LENGTH);
    }

    // Since string is now max 250 chars, this Regex is guarantee to be safe and fast.
    safeName = safeName.replace(/[. ]+$/, '');

    // Windows Reserved Names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
    const reservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
    if (reservedRe.test(safeName)) {
        safeName = `${safeName}${replacement}`;
    }

    return safeName || undefined;
};
