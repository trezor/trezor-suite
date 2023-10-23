import styled from 'styled-components';

import {
    getChangelogUrl,
    getFwUpdateVersion,
    parseFirmwareChangelog,
} from '@suite-common/suite-utils';
import { Icon, Tooltip, variables } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';
import { AcquiredDevice } from '@suite-common/suite-types';
import { FirmwareType } from '@trezor/connect';

import { Translation, TrezorLink } from 'src/components/suite';
import { FirmwareChangelog } from 'src/components/firmware';
import { useFirmware, useTranslation, useSelector } from 'src/hooks/suite';
import { getSuiteFirmwareTypeString } from 'src/utils/firmware';

const FwVersionWrapper = styled.div`
    display: flex;
    width: 100%;
    max-width: 364px;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0px;
`;

const FwVersion = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-align: center;

    &:only-child {
        margin: 0 auto;
    }
`;

const Version = styled.div<{ isNew?: boolean }>`
    color: ${({ isNew, theme }) => (isNew ? theme.TYPE_GREEN : theme.TYPE_LIGHT_GREY)};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-variant-numeric: tabular-nums;
    margin-top: 6px;
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
    device: AcquiredDevice;
    customFirmware?: boolean;
    targetFirmwareType?: FirmwareType;
}

export const FirmwareOffer = ({
    device,
    customFirmware,
    targetFirmwareType,
}: FirmwareOfferProps) => {
    const useDevkit = useSelector(state => state.firmware.useDevkit);
    const { targetType } = useFirmware();
    const { translationString } = useTranslation();

    const currentVersion = device.firmware !== 'none' ? getFirmwareVersion(device) : undefined;
    const nextVersion = customFirmware
        ? translationString('TR_CUSTOM_FIRMWARE_VERSION')
        : getFwUpdateVersion(device);
    const parsedChangelog = customFirmware
        ? null
        : parseFirmwareChangelog(device.firmwareRelease?.release);
    const changelogUrl = getChangelogUrl(device);

    const currentFirmwareType = getSuiteFirmwareTypeString(device.firmwareType);
    const futureFirmwareType = getSuiteFirmwareTypeString(targetFirmwareType || targetType);

    const nextVersionElement = (
        <Version isNew data-test="@firmware/offer-version/new">
            {futureFirmwareType ? translationString(futureFirmwareType) : ''}
            {nextVersion ? ` ${nextVersion}` : ''}
            {useDevkit ? ' DEVKIT' : ''}
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
                    <Icon icon="ARROW_RIGHT_LONG" size={16} />
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
                                    icon="EXTERNAL_LINK"
                                    href={parsedChangelog.notes || changelogUrl}
                                >
                                    <Translation id="TR_VIEW_ALL" />
                                </StyledLink>
                            </>
                        }
                        content={<FirmwareChangelog changelog={parsedChangelog.changelog} />}
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
