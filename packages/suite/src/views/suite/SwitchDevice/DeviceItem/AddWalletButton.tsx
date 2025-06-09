import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { selectDeviceThunk, startDiscoveryThunk } from '@suite-common/wallet-core';
import { WalletType } from '@suite-common/wallet-types';
import {
    Button,
    Card,
    Column,
    HotkeyBadge,
    Icon,
    IconButton,
    Row,
    Text,
    Tooltip,
} from '@trezor/components';
import { CardButton } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectIsDeviceOrUiLocked } from 'src/reducers/suite/suiteReducer';
import { AcquiredDevice, ForegroundAppProps, TrezorDevice } from 'src/types/suite';

interface AddWalletButtonProps {
    device: TrezorDevice;
    instances: AcquiredDevice[];
    onCancel: ForegroundAppProps['onCancel'];
}

export const AddWalletButton = ({ device, instances, onCancel }: AddWalletButtonProps) => {
    // Find a "standard wallet" among user's wallet instances. If no such wallet is found, the variable is undefined.
    const emptyPassphraseWalletExists = instances.find(d => d.useEmptyPassphrase && d.state);
    const isDeviceOrUiLocked = useSelector(selectIsDeviceOrUiLocked);
    const isPassphraseProtectionEnabled = Boolean(device?.features?.passphrase_protection);
    const dispatch = useDispatch();
    const isLocked = !device || !device.connected || isDeviceOrUiLocked;
    const [isPassphraseExpanded, setIsPassphraseExpanded] = useState(false);

    const onAddWallet = ({
        walletType,
        isExisting,
    }: {
        walletType: WalletType;
        isExisting?: boolean;
    }) => {
        onCancel(false);
        dispatch(selectDeviceThunk({ device }));
        dispatch(
            startDiscoveryThunk({
                device,
                isAddingHiddenWallet: walletType === WalletType.PASSPHRASE,
                isAddingExistingWallet: isExisting,
            }),
        );
    };

    const ExpandedPassphraseContainer = () => (
        <Card paddingType="small">
            <Row alignItems="center" justifyContent="space-between">
                <Text>
                    <Translation id="TR_ADD_HIDDEN_WALLET" />
                </Text>
                <IconButton
                    variant="tertiary"
                    icon="x"
                    size="tiny"
                    onClick={() => {
                        setIsPassphraseExpanded(false);
                    }}
                />
            </Row>
            <Column gap={spacings.xxs} width="100%" margin={{ top: spacings.sm }}>
                <CardButton
                    data-testid="@switch-device/add-new-hidden-wallet-button"
                    isDisabled={isLocked}
                    onClick={() =>
                        onAddWallet({
                            walletType: WalletType.PASSPHRASE,
                        })
                    }
                >
                    <Row gap={spacings.md} alignItems="center">
                        <Icon name="plusCircleFilled" variant="primary" />
                        <Text variant="primary" typographyStyle="highlight">
                            <Translation id="TR_NEW_PASSPHRASE_WALLET" />
                        </Text>
                    </Row>
                </CardButton>
                <CardButton
                    data-testid="@switch-device/add-existing-hidden-wallet-button"
                    isDisabled={isLocked}
                    onClick={() =>
                        onAddWallet({
                            walletType: WalletType.PASSPHRASE,
                            isExisting: true,
                        })
                    }
                >
                    <Row gap={spacings.md} alignItems="center" justifyContent="space-between">
                        <Row gap={spacings.md} alignItems="center">
                            <Icon name="folderOpen" variant="tertiary" />
                            <Text variant="tertiary">
                                <Translation id="TR_OPEN_PREVIOUSLY_USED_WALLET" />
                            </Text>
                        </Row>
                        {!isLocked && <HotkeyBadge hotkey={['ALT', 'KEY_P']} />}
                    </Row>
                </CardButton>
            </Column>
        </Card>
    );

    return (
        <Tooltip
            content={isLocked && <Translation id="TR_TO_ACCESS_OTHER_WALLETS" />}
            cursor="pointer"
            placement="bottom"
        >
            <Column flex="1" gap={spacings.xs} alignItems="center">
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

                {isPassphraseProtectionEnabled &&
                    (isPassphraseExpanded ? (
                        <ExpandedPassphraseContainer />
                    ) : (
                        <Button
                            data-testid="@switch-device/add-hidden-wallet-button"
                            variant="tertiary"
                            isFullWidth
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
