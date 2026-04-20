import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Translation, useTranslation } from '@suite/intl';
import { selectIsDebugModeActive, selectTorOnionLinks } from '@suite/settings';
import { type FirmwareUpdateState, selectUseDevkit } from '@suite-common/firmware';
import {
    getChangelogUrl,
    getFwUpdateVersion,
    parseFirmwareChangelog,
} from '@suite-common/suite-utils';
import {
    Column,
    H4,
    Icon,
    Link,
    Markdown,
    Row,
    Text,
    TextButton,
    Tooltip,
} from '@trezor/components';
import { type FirmwareType } from '@trezor/connect';
import { getFirmwareVersion } from '@trezor/device-utils';
import { spacings } from '@trezor/theme';
import { TOR_URLS } from '@trezor/urls';
import { urlToOnion } from '@trezor/utils';

import { getSuiteFirmwareTypeString } from '../update/firmwareUtils';
import { type FirmwareUpgradeRootState, selectIsTorEnabled } from '../update/state';
import { useFirmwareDesktopUpdate } from '../update/useFirmwareDesktopUpdate';

type FirmwareOfferProps = {
    isCustomFirmware?: boolean;
    targetFirmwareType?: FirmwareType;
};

type DebugOnlyBadgeProps = {
    children?: React.ReactNode;
};

const DebugOnlyBadge = ({ children }: DebugOnlyBadgeProps) => (
    <Row gap={spacings.xs}>
        {children}
        <Text typographyStyle="body-xs" intent="warning">
            <Translation id="TR_DEBUG_ONLY" />
        </Text>
    </Row>
);

type MarkdownWithComponentsProps = {
    children: string;
};

const MarkdownWithComponents = ({ children }: MarkdownWithComponentsProps) => {
    const isTorEnabled = useSelector(selectIsTorEnabled);
    const torOnionLinks = useSelector((state: FirmwareUpgradeRootState) =>
        selectTorOnionLinks(state),
    );

    const getLinkUrl = useMemo(
        () => (href?: string) => {
            if (!href) {
                return undefined;
            }

            if (isTorEnabled && torOnionLinks) {
                return urlToOnion(href, TOR_URLS) || href;
            }

            return href;
        },
        [isTorEnabled, torOnionLinks],
    );

    return (
        <Markdown
            components={{
                a: ({ children: linkChildren, href }) => {
                    const targetHref = getLinkUrl(href);

                    if (!targetHref) {
                        return null;
                    }

                    return <Link href={targetHref}>{linkChildren}</Link>;
                },
            }}
        >
            {children}
        </Markdown>
    );
};

export const FirmwareOffer = ({ isCustomFirmware, targetFirmwareType }: FirmwareOfferProps) => {
    const useDevkit = useSelector(
        (state: FirmwareUpgradeRootState & { firmware: FirmwareUpdateState }) =>
            selectUseDevkit(state),
    );
    const isDebugModeActive = useSelector((state: FirmwareUpgradeRootState) =>
        selectIsDebugModeActive(state),
    );
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
