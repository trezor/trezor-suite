import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectIsDeviceOrUiLocked } from '@suite/locks';
import { selectDeviceThunk, startDiscoveryThunk } from '@suite-common/wallet-core';
import { WalletType } from '@suite-common/wallet-types';
import { Button, Card, Column, IconButton, Row, Text, Tooltip } from '@trezor/components';

import { closeModalApp, goto } from 'src/actions/suite/routerActions';
import { useSelector } from 'src/hooks/suite';
import { AcquiredDevice, ForegroundAppProps, TrezorDevice } from 'src/types/suite';

interface AddWalletButtonProps {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    onCancel?: ForegroundAppProps['onCancel'];
}

export const AddWalletButton = ({ device, instances, onCancel }: AddWalletButtonProps) => {
    // Find a "standard wallet" among user's wallet instances. If no such wallet is found, the variable is undefined.
    const emptyPassphraseWalletExists = instances.find(d => d.useEmptyPassphrase && d.state);

    const isDeviceOrUiLocked = useSelector(selectIsDeviceOrUiLocked);
    const isPassphraseProtectionEnabled = Boolean(device?.features?.passphrase_protection);
    const dispatch = useDispatch();
    const isLocked = !device || !device.connected || isDeviceOrUiLocked;
    const [isPassphraseExpanded, setIsPassphraseExpanded] = useState(false);

    if (!isPassphraseProtectionEnabled && emptyPassphraseWalletExists) {
        return null;
    }

    const onAddWallet = ({
        walletType,
        isExisting,
    }: {
        walletType: WalletType;
        isExisting?: boolean;
    }) => {
        onCancel?.(false);
        dispatch(selectDeviceThunk({ device }));
        dispatch(closeModalApp());
        // TODO: when creating a new hidden wallet, we should not start discovery yet, but only after going through the best practices flow
        dispatch(
            startDiscoveryThunk({
                device,
                isAddingHiddenWallet: walletType === WalletType.PASSPHRASE,
                isAddingExistingWallet: isExisting,
            }),
        );
        dispatch(goto('suite-index'));
    };

    const ExpandedPassphraseContainer = () => (
        <Card paddingType="none" fillType="flat">
            <Column gap={12} padding={12}>
                <Row alignItems="center" justifyContent="space-between">
                    <Text>
                        <Translation id="TR_ADD_HIDDEN_WALLET" />
                    </Text>
                    <IconButton
                        intent="neutral"
                        priority="secondary"
                        icon="x"
                        onClick={() => {
                            setIsPassphraseExpanded(false);
                        }}
                    />
                </Row>
                <Column gap={8}>
                    <Button
                        data-testid="@switch-device/add-new-hidden-wallet-button"
                        intent="brand"
                        priority="secondary"
                        size="large"
                        iconLeft="plusCircleFilled"
                        width="100%"
                        isDisabled={isLocked}
                        onClick={() =>
                            onAddWallet({
                                walletType: WalletType.PASSPHRASE,
                            })
                        }
                    >
                        <Translation id="TR_NEW_PASSPHRASE_WALLET" />
                    </Button>
                    <Button
                        data-testid="@switch-device/add-existing-hidden-wallet-button"
                        intent="neutral"
                        priority="secondary"
                        size="large"
                        iconLeft="folderOpen"
                        width="100%"
                        isDisabled={isLocked}
                        onClick={() =>
                            onAddWallet({
                                walletType: WalletType.PASSPHRASE,
                                isExisting: true,
                            })
                        }
                        shortcut={!isLocked ? ['ALT', 'KEY_P'] : undefined}
                    >
                        <Translation id="TR_OPEN_PREVIOUSLY_USED_WALLET" />
                    </Button>
                </Column>
            </Column>
        </Card>
    );

    return (
        <Tooltip
            content={isLocked && <Translation id="TR_TO_ACCESS_OTHER_WALLETS" />}
            cursor="pointer"
            placement="bottom"
        >
            <Column flex="1" gap={8} alignItems="center">
                {!emptyPassphraseWalletExists && (
                    <Button
                        data-testid="@switch-device/add-wallet-button"
                        intent="neutral"
                        priority="secondary"
                        width="100%"
                        size="large"
                        iconLeft="plus"
                        isDisabled={isLocked}
                        onClick={() => onAddWallet({ walletType: WalletType.STANDARD })}
                    >
                        <Translation id="TR_ADD_WALLET" />
                    </Button>
                )}

                {isPassphraseProtectionEnabled &&
                    (isPassphraseExpanded ? (
                        <ExpandedPassphraseContainer />
                    ) : (
                        <Button
                            data-testid="@switch-device/add-hidden-wallet-button"
                            intent="neutral"
                            priority="secondary"
                            width="100%"
                            size="large"
                            iconLeft="plus"
                            isDisabled={isLocked}
                            onClick={() => setIsPassphraseExpanded(true)}
                        >
                            <Translation id="TR_ADD_HIDDEN_WALLET" />
                        </Button>
                    ))}
            </Column>
        </Tooltip>
    );
};
