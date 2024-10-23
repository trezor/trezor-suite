import { Button, Column, HotkeyBadge, Row, Tooltip } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { TrezorDevice, AcquiredDevice, ForegroundAppProps } from 'src/types/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { spacings } from '@trezor/theme';
import { WalletType } from '@suite-common/wallet-types';
import { addWalletThunk } from 'src/actions/wallet/addWalletThunk';
import { selectIsDeviceOrUiLocked } from 'src/reducers/suite/suiteReducer';

interface AddWalletButtonProps {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    onCancel: ForegroundAppProps['onCancel'];
}

export const AddWalletButton = ({ device, instances, onCancel }: AddWalletButtonProps) => {
    const dispatch = useDispatch();
    // Find a "standard wallet" among user's wallet instances. If no such wallet is found, the variable is undefined.
    const emptyPassphraseWalletExists = instances.find(d => d.useEmptyPassphrase && d.state);
    const isDeviceOrUiLocked = useSelector(selectIsDeviceOrUiLocked);
    const isPassphraseProtectionEnabled = Boolean(device?.features?.passphrase_protection);

    // opportunity to bring useDeviceLocks back (extract it from useDevice hook)?
    // useDevice hook is not really suited for this since we need to pass the device as a prop
    // and there is no point in useDevice returning the same device object we would have passed
    const isLocked = !device || !device.connected || isDeviceOrUiLocked;

    const onAddWallet = ({ walletType }: { walletType: WalletType }) => {
        dispatch(addWalletThunk({ walletType, device }));
        onCancel(false);
    };

    return (
        <Tooltip
            content={!isLocked && <Translation id="TR_TO_ACCESS_OTHER_WALLETS" />}
            cursor="pointer"
            placement="bottom"
        >
            <Column flex="1" gap={spacings.xs}>
                {!emptyPassphraseWalletExists && (
                    <Button
                        data-testid="@switch-device/add-wallet-button"
                        variant="tertiary"
                        isFullWidth
                        icon="plus"
                        isDisabled={isLocked}
                        onClick={() => onAddWallet({ walletType: WalletType.STANDARD })}
                    >
                        <Translation id="TR_ADD_WALLET" />
                    </Button>
                )}

                {isPassphraseProtectionEnabled && (
                    <Button
                        data-testid="@switch-device/add-hidden-wallet-button"
                        variant="tertiary"
                        isFullWidth
                        icon="plus"
                        isDisabled={isLocked}
                        onClick={() => onAddWallet({ walletType: WalletType.PASSPHRASE })}
                    >
                        <Row gap={spacings.xs}>
                            <Translation id="TR_ADD_HIDDEN_WALLET" />{' '}
                            {!isLocked && <HotkeyBadge hotkey={['ALT', 'KEY_P']} />}
                        </Row>
                    </Button>
                )}
            </Column>
        </Tooltip>
    );
};
