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

type CreateConnectExplorerStatusParams = {
    stableVersion: string;
    canaryVersion: string;
};

const createConnectExplorerStatus = ({
    stableVersion,
    canaryVersion,
}: CreateConnectExplorerStatusParams) => {
    const version = canaryVersion === '-' ? stableVersion : canaryVersion;
    const majorVersion = version.split('.')[0];
    const stableMajorVersion = stableVersion.split('.')[0];
    const versionLink = `[connect.trezor.io/${version}](https://connect.trezor.io/${version}/)`;
    const persistentLink = `[connect.trezor.io/${majorVersion}](https://connect.trezor.io/${majorVersion}/)`;

    if (canaryVersion !== '-' && majorVersion !== stableMajorVersion) {
        return `Connect ${majorVersion} has no stable release yet — use ${versionLink} to access the prerelease version of Connect Explorer. Once Connect ${majorVersion} is released, the persistent link ${persistentLink} will point to the latest stable version.`;
    }

    if (canaryVersion !== '-') {
        return `Use ${versionLink} to access the prerelease version of Connect Explorer. The persistent link ${persistentLink} points to the latest stable version.`;
    }

    return `Use ${versionLink} to access this release of Connect Explorer. The persistent link ${persistentLink} points to the latest stable version.`;
};

type UpdateConnectChangelogParams = {
    changelog: string;
    versionTable: string;
    deploymentTable: string;
    stableVersion: string;
    canaryVersion: string;
};

export const updateConnectChangelog = ({
    changelog,
    versionTable,
    deploymentTable,
    stableVersion,
    canaryVersion,
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

    const releaseHistoryStartIndex = lines.findIndex(
        (line, index) => index > deploymentVersionRowIndex && /^#\s+\d/.test(line),
    );
    if (releaseHistoryStartIndex === -1) {
        throw new Error('Could not find the Connect release history in CHANGELOG.md');
    }

    const version = canaryVersion === '-' ? stableVersion : canaryVersion;
    const versionTableStartIndex = getTableStartIndex(lines, packageVersionRowIndex);
    const introduction = lines.slice(0, versionTableStartIndex).join('\n');
    const releaseHistory = lines.slice(releaseHistoryStartIndex).join('\n');
    const updatedIntroduction = updateMigrationGuideUrls(introduction, version);
    const introductionSeparator = updatedIntroduction ? '\n' : '';
    const connectExplorerStatus = createConnectExplorerStatus({ stableVersion, canaryVersion });

    return `${updatedIntroduction}${introductionSeparator}${versionTable}\n${deploymentTable}\n${connectExplorerStatus}\n\n${releaseHistory}`;
};
