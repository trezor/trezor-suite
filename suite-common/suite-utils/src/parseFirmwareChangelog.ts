import { FirmwareRelease } from '@trezor/connect';

export type ParseFirmwareChangelogParams = {
    release?: FirmwareRelease;
    isBtcOnly: boolean;
};

export type ParseFirmwareChangelogResult = {
    changelog: string;
    versionString: string;
};

type ChangelogField = keyof Pick<FirmwareRelease, 'changelog' | 'changelog_bitcoinonly'>;

export const parseFirmwareChangelog = ({
    release,
    isBtcOnly,
}: ParseFirmwareChangelogParams): ParseFirmwareChangelogResult | null => {
    const changeLogField: ChangelogField = isBtcOnly ? 'changelog_bitcoinonly' : 'changelog';

    if (
        release === undefined ||
        (release[changeLogField] === undefined && release['changelog'] === undefined)
    ) {
        return null;
    }

    const changelogRaw = release[changeLogField] ?? release['changelog']; // For older releases we don't have the changelog for BtcOnly firmware so we fallback to universal
    const changelog = (Array.isArray(changelogRaw) ? changelogRaw.join('\n') : changelogRaw).trim();

    if (changelog.length === 0) {
        return null;
    }

    return {
        changelog,
        versionString: release.version.join('.'),
    };
};
