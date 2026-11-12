// Every package in the publish closure is bumped with each Connect release, even when nothing in
// it changed, and every published version needs its own heading.
const formatChangelogEntry = (version: string, commitLines: string[]) => {
    const changes = commitLines.filter(line => line.trim());
    const body = changes.length ? changes.join('\n') : '-   Version bump only.';

    return `# ${version}\n\n${body}`;
};

// Anything above the first version heading, such as the pointer to the Connect changelog in the
// thin packages, stays at the top of the file. A file without a version heading has an unknown
// layout, so the entry goes first, as before.
export const addChangelogEntry = (changelog: string, version: string, commitLines: string[]) => {
    const entry = formatChangelogEntry(version, commitLines);
    const historyStart = changelog.search(/^# \d/m);

    if (historyStart === -1) {
        return [entry, changelog.trim()].filter(Boolean).join('\n\n');
    }

    return `${changelog.slice(0, historyStart)}${entry}\n\n${changelog.slice(historyStart)}`;
};
