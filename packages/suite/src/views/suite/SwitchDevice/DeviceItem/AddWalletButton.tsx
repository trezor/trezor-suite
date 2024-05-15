import styled from 'styled-components';

import { Button, Tooltip } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { TrezorDevice, AcquiredDevice } from 'src/types/suite';
import { useSelector } from 'src/hooks/suite';
import { SUITE } from 'src/actions/suite/constants';
import { spacingsPx } from '@trezor/theme';

const AddWallet = styled.div`
    display: flex;
    width: 100%;
    margin-top: 10px;
`;

const StyledTooltip = styled(Tooltip)`
    width: 100%;
`;

const Rows = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${spacingsPx.xs};
`;

const Columns = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: ${spacingsPx.xs};
`;

interface AddWalletButtonProps {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    addDeviceInstance: (instance: TrezorDevice) => Promise<void>;
    selectDeviceInstance: (instance: TrezorDevice) => void;
}

export const AddWalletButton = ({
    device,
    instances,
    addDeviceInstance,
    selectDeviceInstance,
}: AddWalletButtonProps) => {
    const hasAtLeastOneWallet = instances.find(d => d.state);
    // Find a "standard wallet" among user's wallet instances. If no such wallet is found, the variable is undefined.
    const emptyPassphraseWalletExists = instances.find(d => d.useEmptyPassphrase && d.state);
    const locks = useSelector(state => state.suite.locks);

    // opportunity to bring useDeviceLocks back (extract it from useDevice hook)?
    // useDevice hook is not really suited for this since we need to pass the device as a prop
    // and there is no point in useDevice returning the same device object we would have passed
    const isLocked =
        !device ||
        !device.connected ||
        locks.includes(SUITE.LOCK_TYPE.DEVICE) ||
        locks.includes(SUITE.LOCK_TYPE.UI);

    const onAddWallet = () => {
        if (hasAtLeastOneWallet) {
            addDeviceInstance(device);
        } else {
            selectDeviceInstance(instances[0]);
        }
    };

    return (
        <AddWallet>
            <StyledTooltip
                content={isLocked && <Translation id="TR_TO_ACCESS_OTHER_WALLETS" />}
                cursor="pointer"
                placement="bottom"
            >
                <Columns>
                    {!emptyPassphraseWalletExists && (
                        <Button
                            data-test="@switch-device/add-wallet-button"
                            variant="tertiary"
                            isFullWidth
                            icon="PLUS"
                            isDisabled={isLocked}
                            onClick={onAddWallet}
                        >
                            <Translation id="TR_ADD_WALLET" />
                        </Button>
                    )}

                    <Button
                        data-test="@switch-device/add-hidden-wallet-button"
                        variant="tertiary"
                        isFullWidth
                        icon="PLUS"
                        isDisabled={isLocked}
                        onClick={onAddWallet}
                    >
                        <Rows>
                            <Translation id="TR_ADD_HIDDEN_WALLET" />
                        </Rows>
                    </Button>
                </Columns>
            </StyledTooltip>
        </AddWallet>
    );
};
