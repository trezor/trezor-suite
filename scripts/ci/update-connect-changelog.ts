const isTableRow = (line: string) => line.startsWith('|');

const getTableStartIndex = (lines: string[], tableRowIndex: number) => {
    let tableStartIndex = tableRowIndex;

    while (tableStartIndex > 0 && isTableRow(lines[tableStartIndex - 1] ?? '')) {
        tableStartIndex -= 1;
    }

    return tableStartIndex;
};

const updateMigrationGuideUrls = (content: string, version: string) =>
    content.replace(
        /(https:\/\/connect\.trezor\.io\/)[^/]+(\/guides\/(?:migrating-to-connect-10|new-connect-flow-in-trezor-suite))/g,
        `$1${version}$2`,
    );

type UpdateConnectChangelogParams = {
    changelog: string;
    versionTable: string;
    deploymentTable: string;
    version: string;
};

export const updateConnectChangelog = ({
    changelog,
    versionTable,
    deploymentTable,
    version,
}: UpdateConnectChangelogParams) => {
    const lines = changelog.split('\n');
    const packageVersionRowIndex = lines.findIndex(line =>
        /\|\s*npm @trezor\/connect\s+\|/.test(line),
    );
    const deploymentVersionRowIndex = lines.findIndex(line =>
        line.trim().startsWith('| connect.trezor.io/'),
    );

    if (packageVersionRowIndex === -1 || deploymentVersionRowIndex === -1) {
        throw new Error('Could not find the current Connect version tables in CHANGELOG.md');
    }

    const versionTableStartIndex = getTableStartIndex(lines, packageVersionRowIndex);
    const introduction = lines.slice(0, versionTableStartIndex).join('\n');
    const changelogAfterTables = lines.slice(deploymentVersionRowIndex + 1).join('\n');
    const updatedIntroduction = updateMigrationGuideUrls(introduction, version);
    const introductionSeparator = updatedIntroduction ? '\n' : '';

    return `${updatedIntroduction}${introductionSeparator}${versionTable}\n${deploymentTable}${changelogAfterTables}`;
};
