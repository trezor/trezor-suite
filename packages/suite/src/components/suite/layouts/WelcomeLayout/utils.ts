export const removeSettingsFromUrl = (url: string): string => {
    const settingsIndex = url.indexOf('settings');
    if (settingsIndex !== -1) {
        return url.slice(0, settingsIndex);
    }

    return url;
};
