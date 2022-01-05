import React from 'react';
import styled from 'styled-components';
import { Translation, TrezorLink } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { FIRMWARE_COMMIT_URL } from '@suite-constants/urls';
import { useDevice, useAnalytics, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { getFwVersion, isBitcoinOnly } from '@suite-utils/device';
import { Button, Tooltip } from '@trezor/components';

const Version = styled.div`
    span {
        display: flex;
        align-items: center;
    }
`;

const VersionButton = styled(Button)`
    padding-left: 1ch;
`;

const VersionTooltip = styled(Tooltip)`
    display: inline-flex;
    margin: 0 4px;
`;

interface Props {
    isDeviceLocked: boolean;
}

const CheckRecoverySeed = ({ isDeviceLocked }: Props) => {
    const { device } = useDevice();
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const analytics = useAnalytics();

    if (!device?.features) {
        return null;
    }

    const revision = device?.features?.revision;
    return (
        <SectionItem>
            <TextColumn
                title={<Translation id="TR_FIRMWARE_VERSION" />}
                description={
                    <Version>
                        <Translation
                            id="TR_YOUR_CURRENT_FIRMWARE"
                            values={{
                                version: (
                                    <VersionTooltip content={revision} disabled={!revision}>
                                        <TrezorLink
                                            href={FIRMWARE_COMMIT_URL + revision}
                                            variant="nostyle"
                                        >
                                            <VersionButton
                                                variant="tertiary"
                                                icon={revision ? 'EXTERNAL_LINK' : undefined}
                                                alignIcon="right"
                                                disabled={!revision}
                                            >
                                                {getFwVersion(device)}
                                                {isBitcoinOnly(device) && ' (bitcoin-only)'}
                                            </VersionButton>
                                        </TrezorLink>
                                    </VersionTooltip>
                                ),
                            }}
                        />
                    </Version>
                }
            />
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    onClick={() => {
                        goto('firmware-index', { cancelable: true });
                        analytics.report({
                            type: 'settings/device/goto/firmware',
                        });
                    }}
                    data-test="@settings/device/update-button"
                    isDisabled={isDeviceLocked}
                >
                    {device && ['required', 'outdated'].includes(device.firmware) && (
                        <Translation id="TR_UPDATE_AVAILABLE" />
                    )}
                    {device && device.firmware === 'valid' && <Translation id="TR_UP_TO_DATE" />}
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
export default CheckRecoverySeed;
