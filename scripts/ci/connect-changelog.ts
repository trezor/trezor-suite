// Anything above the first version heading, such as the pointer to the Connect changelog in the
// thin packages, stays at the top of the file. A file without a version heading has an unknown
// layout, so the entry goes first, as before.
export const addChangelogEntry = (changelog: string, version: string, commitLines: string[]) => {
    const entry = `# ${version}\n\n${commitLines.join('\n')}`;
    const historyStart = changelog.search(/^# \d/m);

    if (historyStart === -1) {
        return [entry, changelog.trim()].filter(Boolean).join('\n\n');
    }

    return `${changelog.slice(0, historyStart)}${entry}\n\n${changelog.slice(historyStart)}`;
};
