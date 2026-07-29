import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { getSuiteFirmwareTypeString, useFirmwareDesktopUpdate } from '@suite/firmware-upgrade';
import { Translation, useTranslation } from '@suite/intl';
import {
    getChangelogUrl,
    getFwUpdateVersion,
    parseFirmwareChangelog,
} from '@suite-common/suite-utils';
import { Column, Icon, Row, Text, TextButton, Tooltip } from '@trezor/components';
import { type FirmwareType } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
import { ArrowRightIcon } from '@trezor/icons';

import { MarkdownWithComponents } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';

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
            <Column alignItems="center" gap={4}>
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
            margin={{ vertical: 16, horizontal: 'auto' }}
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
            {currentVersion && <Icon as={ArrowRightIcon} size={16} />}
            <Column alignItems="center" gap={4}>
                <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                    <Translation id="TR_ONBOARDING_NEW_VERSION" />
                </Text>
                <Tooltip
                    hasIcon
                    content={
                        <Column padding={4} gap={4}>
                            {parsedChangelog && (
                                <Row justifyContent="space-between">
                                    <Text typographyStyle="body-sm-strong" intent="neutral">
                                        <Translation
                                            id="TR_VERSION"
                                            values={{ version: parsedChangelog.versionString }}
                                        />
                                    </Text>
                                    <TextButton
                                        size="small"
                                        intent="neutral"
                                        priority="secondary"
                                        href={changelogUrl}
                                    >
                                        <Translation id="TR_VIEW_ALL" />
                                    </TextButton>
                                </Row>
                            )}
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
