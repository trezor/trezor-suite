import React from 'react';
import styled from 'styled-components';
import { Button, Tooltip } from '@trezor/components';
import { Translation } from '@suite-components';
import { TrezorDevice, AcquiredDevice } from '@suite-types';
import { useDevice, useAnalytics } from '@suite-hooks';

const AddWallet = styled.div`
    display: flex;
    justify-content: center;
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
    const { isLocked } = useDevice();
    const analytics = useAnalytics();
    return (
        <AddWallet>
            <Tooltip enabled={!device.connected} placement="top" content={tooltipMsg}>
                <Button
                    data-test="@switch-device/add-wallet-button"
                    variant="tertiary"
                    icon="PLUS"
                    isDisabled={isLocked()}
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
                </Button>
            </Tooltip>
        </AddWallet>
    );
};

export default AddWalletButton;
