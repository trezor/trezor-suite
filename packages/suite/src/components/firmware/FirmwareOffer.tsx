import styled from 'styled-components';

import {
    getChangelogUrl,
    getFwUpdateVersion,
    parseFirmwareChangelog,
} from '@suite-common/suite-utils';
import { Icon, Markdown, Tooltip, variables } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';
import { FirmwareType } from '@trezor/connect';

import { Translation, TrezorLink } from 'src/components/suite';
import { useFirmware, useTranslation, useSelector } from 'src/hooks/suite';
import { getSuiteFirmwareTypeString } from 'src/utils/firmware';
import { spacingsPx } from '@trezor/theme';

const FwVersionWrapper = styled.div`
    display: flex;
    width: 100%;
    max-width: 364px;
    justify-content: space-between;
    align-items: center;
    padding: ${spacingsPx.md} 0;
`;

const FwVersion = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-align: center;

    &:only-child {
        margin: 0 auto;
    }
`;

const Version = styled.div<{ $isNew?: boolean }>`
    color: ${({ $isNew, theme }) => ($isNew ? theme.backgroundPrimaryDefault : theme.textSubdued)};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-variant-numeric: tabular-nums;
    margin-top: ${spacingsPx.xs};
`;

const Label = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
`;

const StyledLink = styled(TrezorLink)`
    margin-left: auto;
    text-decoration: underline;

    path {
        fill: ${({ theme }) => theme.iconSubdued};
    }
`;

interface FirmwareOfferProps {
    customFirmware?: boolean;
    targetFirmwareType?: FirmwareType;
}

export const FirmwareOffer = ({ customFirmware, targetFirmwareType }: FirmwareOfferProps) => {
    const useDevkit = useSelector(state => state.firmware.useDevkit);
    const { originalDevice } = useFirmware();
    const { translationString } = useTranslation();

    if (!originalDevice?.firmwareRelease) {
        return null;
    }

    const currentVersion = getFirmwareVersion(originalDevice);
    const nextVersion = customFirmware
        ? translationString('TR_CUSTOM_FIRMWARE_VERSION')
        : getFwUpdateVersion(originalDevice);

    const isBtcOnly = targetFirmwareType === FirmwareType.BitcoinOnly;

    const parsedChangelog = customFirmware
        ? null
        : parseFirmwareChangelog({ release: originalDevice.firmwareRelease.release, isBtcOnly });
    const changelogUrl = getChangelogUrl(originalDevice);

    const currentFirmwareType = getSuiteFirmwareTypeString(originalDevice.firmwareType);
    const futureFirmwareType = getSuiteFirmwareTypeString(targetFirmwareType);

    const nextVersionElement = (
        <Version $isNew data-testid="@firmware/offer-version/new">
            {futureFirmwareType ? translationString(futureFirmwareType) : ''}
            {nextVersion ? ` ${nextVersion}` : ''}
            {!customFirmware && useDevkit ? ' DEVKIT' : ''}
        </Version>
    );

    return (
        <FwVersionWrapper>
            {currentVersion && (
                <>
                    <FwVersion>
                        <Label>
                            <Translation id="TR_ONBOARDING_CURRENT_VERSION" />
                        </Label>
                        <Version>
                            {currentFirmwareType ? translationString(currentFirmwareType) : ''}
                            {currentVersion ? ` ${currentVersion}` : ''}
                        </Version>
                    </FwVersion>
                    <Icon name="arrowRight" size={16} />
                </>
            )}
            <FwVersion>
                <Label>
                    <Translation id="TR_ONBOARDING_NEW_VERSION" />
                </Label>
                {parsedChangelog ? (
                    <Tooltip
                        dashed
                        isLarge
                        title={
                            <>
                                <Translation
                                    id="TR_VERSION"
                                    values={{ version: parsedChangelog.versionString }}
                                />

                                <StyledLink
                                    type="hint"
                                    variant="nostyle"
                                    icon="arrowUpRight"
                                    href={changelogUrl}
                                >
                                    <Translation id="TR_VIEW_ALL" />
                                </StyledLink>
                            </>
                        }
                        content={<Markdown>{parsedChangelog.changelog}</Markdown>}
                    >
                        {nextVersionElement}
                    </Tooltip>
                ) : (
                    nextVersionElement
                )}
            </FwVersion>
        </FwVersionWrapper>
    );
};
