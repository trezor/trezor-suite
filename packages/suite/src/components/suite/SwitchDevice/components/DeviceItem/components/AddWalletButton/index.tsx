import React from 'react';
import styled from 'styled-components';
import { Button, Tooltip } from '@trezor/components';
import { Translation } from '@suite-components';
import { TrezorDevice, AcquiredDevice } from '@suite-types';

const AddWallet = styled.div`
    display: flex;
    justify-content: center;
`;

interface Props {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    addDeviceInstance: (instance: TrezorDevice) => Promise<void>;
}

const AddWalletButton = ({ device, instances, addDeviceInstance }: Props) => {
    const hasAtLeastOneWallet = instances.find(d => d.state);

    let tooltipMsg: string | JSX.Element = '';
    if (!hasAtLeastOneWallet) {
        tooltipMsg = <Translation id="TR_TO_ACCESS_OTHER_WALLETS_DISCOVER" />;
    }
    if (!device.connected) {
        tooltipMsg = <Translation id="TR_TO_ACCESS_OTHER_WALLETS" />;
    }

    return (
        <AddWallet>
            <Tooltip
                enabled={!device.connected || !hasAtLeastOneWallet}
                placement="top"
                content={tooltipMsg}
            >
                <Button
                    data-test="@switch-device/add-wallet-button"
                    variant="tertiary"
                    icon="PLUS"
                    isDisabled={!device.connected || !hasAtLeastOneWallet}
                    onClick={async () => addDeviceInstance(device)}
                >
                    <Translation id="TR_ADD_WALLET" />
                </Button>
            </Tooltip>
        </AddWallet>
    );
};

export default AddWalletButton;
