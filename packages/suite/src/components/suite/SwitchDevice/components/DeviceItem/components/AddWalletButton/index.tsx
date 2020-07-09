import React from 'react';
import styled from 'styled-components';
import { Button, Tooltip, colors } from '@trezor/components';
import { Translation } from '@suite-components';
import { TrezorDevice, AcquiredDevice } from '@suite-types';
import { useAnalytics, useSelector } from '@suite-hooks';
import { SUITE } from '@suite-actions/constants';

const AddWallet = styled.div`
    display: flex;
    width: 100%;
    margin-top: 10px;
`;

const StyledButton = styled(Button)`
    padding: 16px;
    justify-content: center;
    border: 1px dashed ${colors.NEUE_STROKE_GREY};
    border-radius: 6px;
    background: transparent;

    &:hover,
    &:active,
    &:focus {
        background: transparent;
    }
`;

const StyledTooltip = styled(Tooltip)`
    width: 100%;
`;

interface Props {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    addDeviceInstance: (instance: TrezorDevice) => Promise<void>;
    selectDeviceInstance: (instance: TrezorDevice) => Promise<void>;
}

const AddWalletButton = ({ device, instances, addDeviceInstance, selectDeviceInstance }: Props) => {
    const hasAtLeastOneWallet = instances.find(d => d.state);
    const tooltipMsg = <Translation id="TR_TO_ACCESS_OTHER_WALLETS" />;
    const locks = useSelector(state => state.suite.locks);

    // opportunity to bring useDeviceLocks back (extract it from useDevice hook)?
    // useDevice hook is not really suited for this since we need to pass the device as a prop
    // and there is no point in useDevice returning the same device object we would have passed
    const isLocked =
        !device ||
        !device.connected ||
        locks.includes(SUITE.LOCK_TYPE.DEVICE) ||
        locks.includes(SUITE.LOCK_TYPE.UI);

    const analytics = useAnalytics();
    return (
        <AddWallet>
            <StyledTooltip enabled={!device.connected} placement="top" content={tooltipMsg}>
                <StyledButton
                    data-test="@switch-device/add-wallet-button"
                    variant="tertiary"
                    fullWidth
                    icon="PLUS"
                    isDisabled={isLocked}
                    onClick={() =>
                        hasAtLeastOneWallet
                            ? addDeviceInstance(device)
                            : selectDeviceInstance(instances[0]) &&
                              analytics.report({
                                  type: 'switch-device/add-wallet',
                              })
                    }
                >
                    <Translation id="TR_ADD_WALLET" />
                </StyledButton>
            </StyledTooltip>
        </AddWallet>
    );
};

export default AddWalletButton;
