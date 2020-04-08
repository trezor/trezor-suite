import React from 'react';
import styled from 'styled-components';
import { Button, Tooltip } from '@trezor/components';
import { Translation } from '@suite-components';
import { TrezorDevice, AcquiredDevice } from '@suite-types';
import { useDeviceActionLocks } from '@suite-utils/hooks';

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
    const undiscoveredWallet = instances.find(d => !d.state);
    const tooltipMsg = <Translation id="TR_TO_ACCESS_OTHER_WALLETS" />;
    const [actionEnabled] = useDeviceActionLocks();
    return (
        <AddWallet>
            <Tooltip enabled={!device.connected} placement="top" content={tooltipMsg}>
                <Button
                    data-test="@switch-device/add-wallet-button"
                    variant="tertiary"
                    icon="PLUS"
                    isDisabled={!actionEnabled || (!hasAtLeastOneWallet && !undiscoveredWallet)}
                    onClick={async () => {
                        if (hasAtLeastOneWallet) {
                            // add another instance
                            return addDeviceInstance(device);
                        }
                        if (undiscoveredWallet) {
                            // select "undiscovered" instance
                            return selectDeviceInstance(undiscoveredWallet);
                        }
                    }}
                >
                    <Translation id="TR_ADD_WALLET" />
                </Button>
            </Tooltip>
        </AddWallet>
    );
};

export default AddWalletButton;
