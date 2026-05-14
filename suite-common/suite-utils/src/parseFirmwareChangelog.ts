import { type FirmwareRelease } from '@trezor/device-utils';

export type ParseFirmwareChangelogParams = {
    release?: FirmwareRelease;
};

export type ParseFirmwareChangelogResult = {
    changelog: string;
    versionString: string;
};

export const parseFirmwareChangelog = ({
    release,
}: ParseFirmwareChangelogParams): ParseFirmwareChangelogResult | null => {
    if (
        release === undefined ||
        (release.changelog === undefined && release['changelog'] === undefined)
    ) {
        return null;
    }

    const changelogRaw = release.changelog;
    const changelog = (Array.isArray(changelogRaw) ? changelogRaw.join('\n') : changelogRaw).trim();

    if (changelog.length === 0) {
        return null;
    }

    return {
        changelog,
        versionString: release.version.join('.'),
    };
};
