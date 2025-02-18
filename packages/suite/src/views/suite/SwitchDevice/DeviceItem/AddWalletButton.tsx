import { useState } from 'react';

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

import { addWalletThunk } from 'src/actions/wallet/addWalletThunk';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDeviceOrUiLocked } from 'src/reducers/suite/suiteReducer';
import { AcquiredDevice, ForegroundAppProps, TrezorDevice } from 'src/types/suite';

import { usePassphraseModalContext } from '../../../../components/suite/modals/ReduxModal/DeviceContextModal/PassphraseModalContext';

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
    const [isPassphraseExpanded, setIsPassphraseExpanded] = useState(false);

    const { setPassphraseState, setIsExisting } = usePassphraseModalContext();

    const onAddWallet = ({
        walletType,
        isExisting,
    }: {
        walletType: WalletType;
        isExisting?: boolean;
    }) => {
        if (walletType === WalletType.STANDARD) {
            dispatch(addWalletThunk({ walletType, device }));
            onCancel(false);
        } else {
            if (!isExisting) {
                setPassphraseState('not-exist-best-practices');
                setIsExisting(false);
            } else {
                setPassphraseState('exists-enter-passphrase');
                setIsExisting(true);

                dispatch(addWalletThunk({ walletType, device }));
                onCancel(false);
            }
        }
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
                            isExisting: false,
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

                {isPassphraseProtectionEnabled && (
                    <>
                        {isPassphraseExpanded ? (
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
                        )}
                    </>
                )}
            </Column>
        </Tooltip>
    );
};
