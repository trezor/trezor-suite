import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectIsDeviceOrUiLocked } from '@suite/locks';
import { closeModalApp, goto } from '@suite/router';
import {
    selectDeviceThunk,
    selectIsAnyNetworkEnabled,
    startAddWalletDiscoveryThunk,
} from '@suite-common/wallet-core';
import { WalletType } from '@suite-common/wallet-types';
import { Button, Card, Column, IconButton, Row, Text, Tooltip } from '@trezor/components';
import { FolderOpenIcon, PlusCircleFilledIcon, PlusIcon, XIcon } from '@trezor/icons';

import { useSelector } from 'src/hooks/suite';
import { type AcquiredDevice, type ForegroundAppProps, type TrezorDevice } from 'src/types/suite';

interface AddWalletButtonProps {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    onCancel?: ForegroundAppProps['onCancel'];
}

export const AddWalletButton = ({ device, instances, onCancel }: AddWalletButtonProps) => {
    // Standard wallet = useEmptyPassphrase not explicitly false (true, or undefined when not yet authorized).
    // Mirrors useWalletLabel so the list and this button agree on what counts as a standard wallet.
    const emptyPassphraseWalletExists = instances.find(
        d => d.useEmptyPassphrase !== false && d.state,
    );

    const isDeviceOrUiLocked = useSelector(selectIsDeviceOrUiLocked);
    const isAnyNetworkEnabled = useSelector(selectIsAnyNetworkEnabled);
    const isPassphraseProtectionEnabled = Boolean(device?.features?.passphrase_protection);
    const dispatch = useDispatch();
    const isLocked = !device || !device.connected || isDeviceOrUiLocked;
    const isPassphraseAddDisabled = isLocked || !isAnyNetworkEnabled;
    const showNoNetworksTooltip = !isLocked && !isAnyNetworkEnabled;
    const [isPassphraseExpanded, setIsPassphraseExpanded] = useState(false);

    const goToCoinsSettings = () => {
        onCancel?.(false);
        dispatch(closeModalApp());
        dispatch(goto({ routeName: 'settings-coins' }));
    };

    const noNetworksTooltipContent = (
        <Column gap={12} alignItems="flex-start" maxWidth={250} padding={4}>
            <Translation id="TR_PASSPHRASE_WALLET_NEEDS_ENABLED_NETWORK" />
            <Button
                data-testid="@switch-device/passphrase-go-to-coins-settings"
                intent="neutral"
                priority="secondary"
                size="small"
                onClick={goToCoinsSettings}
            >
                <Translation id="TR_ENABLE_MORE_COINS" />
            </Button>
        </Column>
    );

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
            startAddWalletDiscoveryThunk({
                device,
                isAddingHiddenWallet: walletType === WalletType.PASSPHRASE,
                isAddingExistingWallet: isExisting,
            }),
        );
        dispatch(goto({ routeName: 'suite-index' }));
    };

    const ExpandedPassphraseContainer = () => (
        <Card paddingType="none" type="contrast">
            <Column gap={12} padding={12}>
                <Row alignItems="center" justifyContent="space-between">
                    <Text>
                        <Translation id="TR_ADD_HIDDEN_WALLET" />
                    </Text>
                    <IconButton
                        intent="neutral"
                        priority="secondary"
                        icon={XIcon}
                        onClick={() => {
                            setIsPassphraseExpanded(false);
                        }}
                        tooltip={{ content: <Translation id="TR_CLOSE" /> }}
                    />
                </Row>
                <Column gap={8}>
                    <Button
                        data-testid="@switch-device/add-new-hidden-wallet-button"
                        intent="brand"
                        priority="secondary"
                        size="large"
                        iconLeft={PlusCircleFilledIcon}
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
                        iconLeft={FolderOpenIcon}
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
                        iconLeft={PlusIcon}
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
                        <Tooltip
                            isActive={showNoNetworksTooltip}
                            content={showNoNetworksTooltip ? noNetworksTooltipContent : undefined}
                            cursor="not-allowed"
                            placement="right"
                            width="100%"
                        >
                            <Button
                                data-testid="@switch-device/add-hidden-wallet-button"
                                intent="neutral"
                                priority="secondary"
                                width="100%"
                                size="large"
                                iconLeft={PlusIcon}
                                isDisabled={isPassphraseAddDisabled}
                                onClick={() => setIsPassphraseExpanded(true)}
                            >
                                <Translation id="TR_ADD_HIDDEN_WALLET" />
                            </Button>
                        </Tooltip>
                    ))}
            </Column>
        </Tooltip>
    );
};
