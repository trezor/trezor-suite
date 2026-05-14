import { getSuiteFirmwareTypeString, useFirmwareDesktopUpdate } from '@suite/firmware-upgrade';
import { Translation, useTranslation } from '@suite/intl';
import { selectIsDebugModeActive } from '@suite/settings';
import {
    getChangelogUrl,
    getFwUpdateVersion,
    parseFirmwareChangelog,
} from '@suite-common/suite-utils';
import { Column, H4, Icon, Row, Text, TextButton, Tooltip } from '@trezor/components';
import { type FirmwareType } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
import { spacings } from '@trezor/theme';

import { MarkdownWithComponents } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

import { DebugOnlyBadge } from '../suite/DebugOnlyBadge';

type FirmwareOfferProps = {
    isCustomFirmware?: boolean;
    targetFirmwareType?: FirmwareType;
};

export const FirmwareOffer = ({ isCustomFirmware, targetFirmwareType }: FirmwareOfferProps) => {
    const useDevkit = useSelector(state => state.firmware.useDevkit);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const { originalDevice } = useFirmwareDesktopUpdate();
    const { translationString } = useTranslation();

    if (!originalDevice?.firmwareReleaseConfigInfo) {
        return null;
    }

    const currentVersion = getFirmwareVersion(originalDevice);
    const nextVersion = isCustomFirmware
        ? translationString('TR_CUSTOM_FIRMWARE_VERSION')
        : getFwUpdateVersion(originalDevice);

    const { release } = originalDevice.firmwareReleaseConfigInfo;

    const parsedChangelog = isCustomFirmware ? null : parseFirmwareChangelog({ release });
    const changelogUrl = getChangelogUrl(originalDevice);

    const currentFirmwareType = getSuiteFirmwareTypeString(originalDevice.firmwareType);
    const futureFirmwareType = getSuiteFirmwareTypeString(targetFirmwareType);

    const CurrentVersion = () => (
        <>
            <Column alignItems="center" gap={spacings.xxs}>
                <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                    <Translation id="TR_ONBOARDING_CURRENT_VERSION" />
                </Text>
                <Text typographyStyle="body-sm">
                    {currentFirmwareType ? translationString(currentFirmwareType) : ''}
                    {currentVersion ? ` ${currentVersion}` : ''}
                </Text>
            </Column>
        </>
    );

    return (
        <Row
            justifyContent={currentVersion ? 'space-between' : 'center'}
            maxWidth={360}
            width="100%"
            margin={{ vertical: spacings.md, horizontal: 'auto' }}
        >
            {currentVersion &&
                (isDebugModeActive ? (
                    <Tooltip
                        content={
                            <DebugOnlyBadge>
                                <Text>{originalDevice.features.revision}</Text>
                            </DebugOnlyBadge>
                        }
                    >
                        <CurrentVersion />
                    </Tooltip>
                ) : (
                    <CurrentVersion />
                ))}
            {currentVersion && <Icon name="arrowRight" size={16} />}
            <Column alignItems="center" gap={spacings.xxs}>
                <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                    <Translation id="TR_ONBOARDING_NEW_VERSION" />
                </Text>
                <Tooltip
                    hasIcon
                    title={
                        parsedChangelog ? (
                            <H4>
                                <Translation
                                    id="TR_VERSION"
                                    values={{ version: parsedChangelog.versionString }}
                                />
                            </H4>
                        ) : undefined
                    }
                    addon={
                        parsedChangelog ? (
                            <TextButton
                                size="small"
                                intent="neutral"
                                priority="secondary"
                                href={changelogUrl}
                            >
                                <Translation id="TR_VIEW_ALL" />
                            </TextButton>
                        ) : undefined
                    }
                    content={
                        <Column>
                            {parsedChangelog ? (
                                <MarkdownWithComponents>
                                    {parsedChangelog.changelog}
                                </MarkdownWithComponents>
                            ) : undefined}
                            {isDebugModeActive && (
                                <DebugOnlyBadge>
                                    <Text>{release.firmware_revision}</Text>
                                </DebugOnlyBadge>
                            )}
                        </Column>
                    }
                    isActive={!!parsedChangelog}
                >
                    <Text
                        typographyStyle="body-sm"
                        data-testid="@firmware/offer-version/new"
                        intent="brand"
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
