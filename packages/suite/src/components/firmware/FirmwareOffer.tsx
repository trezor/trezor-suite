import { useFirmwareInstallation } from '@suite-common/firmware';
import {
    getChangelogUrl,
    getFwUpdateVersion,
    parseFirmwareChangelog,
} from '@suite-common/suite-utils';
import { Column, H4, Icon, Markdown, Row, Text, Tooltip } from '@trezor/components';
import { FirmwareType } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
import { spacings } from '@trezor/theme';

import { Translation, TrezorLink } from 'src/components/suite';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { getSuiteFirmwareTypeString } from 'src/utils/firmware';

type FirmwareOfferProps = {
    isCustomFirmware?: boolean;
    targetFirmwareType?: FirmwareType;
};

export const FirmwareOffer = ({ isCustomFirmware, targetFirmwareType }: FirmwareOfferProps) => {
    const useDevkit = useSelector(state => state.firmware.useDevkit);
    const { originalDevice } = useFirmwareInstallation();
    const { translationString } = useTranslation();

    if (!originalDevice?.firmwareRelease) {
        return null;
    }

    const currentVersion = getFirmwareVersion(originalDevice);
    const nextVersion = isCustomFirmware
        ? translationString('TR_CUSTOM_FIRMWARE_VERSION')
        : getFwUpdateVersion(originalDevice);

    const isBtcOnly = targetFirmwareType === FirmwareType.BitcoinOnly;

    const parsedChangelog = isCustomFirmware
        ? null
        : parseFirmwareChangelog({ release: originalDevice.firmwareRelease.release, isBtcOnly });
    const changelogUrl = getChangelogUrl(originalDevice);

    const currentFirmwareType = getSuiteFirmwareTypeString(originalDevice.firmwareType);
    const futureFirmwareType = getSuiteFirmwareTypeString(targetFirmwareType);

    return (
        <Row
            justifyContent={currentVersion ? 'space-between' : 'center'}
            maxWidth={360}
            width="100%"
            margin={{ vertical: spacings.md, horizontal: 'auto' }}
        >
            {currentVersion && (
                <>
                    <Column alignItems="center" gap={spacings.xxs}>
                        <Text typographyStyle="label" variant="tertiary">
                            <Translation id="TR_ONBOARDING_CURRENT_VERSION" />
                        </Text>
                        <Text typographyStyle="hint">
                            {currentFirmwareType ? translationString(currentFirmwareType) : ''}
                            {currentVersion ? ` ${currentVersion}` : ''}
                        </Text>
                    </Column>
                    <Icon name="arrowRight" size={16} />
                </>
            )}
            <Column alignItems="center" gap={spacings.xxs}>
                <Text typographyStyle="label" variant="tertiary">
                    <Translation id="TR_ONBOARDING_NEW_VERSION" />
                </Text>
                <Tooltip
                    hasIcon
                    title={
                        parsedChangelog ? (
                            <Row justifyContent="space-between" width="100%">
                                <H4>
                                    <Translation
                                        id="TR_VERSION"
                                        values={{ version: parsedChangelog.versionString }}
                                    />
                                </H4>
                                <TrezorLink
                                    typographyStyle="hint"
                                    icon="arrowUpRight"
                                    href={changelogUrl}
                                >
                                    <Translation id="TR_VIEW_ALL" />
                                </TrezorLink>
                            </Row>
                        ) : undefined
                    }
                    content={
                        parsedChangelog ? (
                            <Markdown>{parsedChangelog.changelog}</Markdown>
                        ) : undefined
                    }
                    isActive={!!parsedChangelog}
                >
                    <Text
                        typographyStyle="hint"
                        data-testid="@firmware/offer-version/new"
                        variant="primary"
                    >
                        {futureFirmwareType ? translationString(futureFirmwareType) : ''}
                        {nextVersion ? ` ${nextVersion}` : ''}
                        {!isCustomFirmware && useDevkit ? ' DEVKIT' : ''}
                    </Text>
                </Tooltip>
            </Column>
        </Row>
    );
};
