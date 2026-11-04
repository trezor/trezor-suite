interface VersionNameProps {
    latestVersion?: string;
    prerelease: boolean;
}

export const getVersionName = ({ latestVersion, prerelease }: VersionNameProps): string => {
    if (latestVersion === undefined) {
        return '';
    }

    if (prerelease !== undefined) {
        return latestVersion;
    }

    if (!latestVersion.includes('-')) {
        return `${latestVersion}-beta`;
    }

    return latestVersion;
};
