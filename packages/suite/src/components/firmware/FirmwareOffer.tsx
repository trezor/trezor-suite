import styled from 'styled-components';

import { getFwUpdateVersion, parseFirmwareChangelog } from '@suite-common/suite-utils';
import { Icon, Tooltip, variables } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';
import { AcquiredDevice } from '@suite-common/suite-types';
import { FirmwareType } from '@trezor/connect';

import { Translation } from 'src/components/suite';
import { FirmwareChangelog } from 'src/components/firmware';
import { useFirmware, useTranslation, useSelector } from 'src/hooks/suite';
import { getSuiteFirmwareTypeString } from 'src/utils/firmware';

const FwVersionWrapper = styled.div`
    display: flex;
    width: 100%;
    max-width: 364px;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
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
                        rich
                        dashed
                        content={<FirmwareChangelog device={device} {...parsedChangelog} />}
                        placement="top"
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
