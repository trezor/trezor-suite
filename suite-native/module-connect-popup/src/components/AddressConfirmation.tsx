import { useDispatch, useSelector } from 'react-redux';

import {
    connectPopupActions,
    connectPopupVerifyAddressThunk,
    getPermissionDeferred,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { selectSelectedDevice, selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { Button, Card, HStack, IconButton, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const AddressConfirmation = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);
    const device = useSelector(selectSelectedDevice);
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    // todo: only makes sense if device is already authorized (has state)
    const passphraseWalletLabel = device?.useEmptyPassphrase ? (
        <Translation id="deviceManager.wallet.standard" />
    ) : (
        <Translation
            id="deviceManager.wallet.defaultPassphrase"
            values={{ index: device?.walletNumber }}
        />
    );

    const onFinish = () => {
        dispatch(connectPopupActions.finishCall());
    };
    const onConfirm = () => {
        getPermissionDeferred()?.resolve();
    };
    const onVerify = (index: number) => {
        dispatch(connectPopupVerifyAddressThunk({ index }));
    };

    if (popupCall?.state !== 'address-confirmation') return null;

    return (
        <VStack testID="@popup/address-confirmation" spacing="sp16" flex={1}>
            {popupCall.exported ? (
                <TitleHeader
                    title={<Translation id="moduleConnectPopup.confirmAddress.title" />}
                    subtitle={<Translation id="moduleConnectPopup.confirmAddress.message" />}
                />
            ) : (
                <TitleHeader
                    title={<Translation id="moduleConnectPopup.exportAccounts.title" />}
                    subtitle={
                        <Translation
                            id="moduleConnectPopup.exportAccounts.message"
                            values={{
                                passphraseWalletLabel: (
                                    <Text variant="body-md">{passphraseWalletLabel}</Text>
                                ),
                                deviceLabel: <Text variant="body-md">{deviceLabel}</Text>,
                                thirdParty: (
                                    <Text variant="body-md">{popupCall.source.origin}</Text>
                                ),
                            }}
                        />
                    }
                />
            )}
            <Card>
                <VStack>
                    {popupCall.addresses.map((item, index) => (
                        <HStack
                            key={index}
                            alignItems="center"
                            justifyContent="space-between"
                            padding="sp8"
                        >
                            <Text variant="body-sm" style={{ flex: 1 }}>
                                {item.address}
                            </Text>
                            <IconButton
                                size="small"
                                intent={item.validated === 'valid' ? 'brand' : 'neutral'}
                                priority={item.validated === 'valid' ? 'primary' : 'secondary'}
                                iconName={
                                    item.validated === 'valid' ? 'checkCircle' : 'trezorDevices'
                                }
                                onPress={() => onVerify(index)}
                            />
                        </HStack>
                    ))}
                </VStack>
            </Card>

            <Button
                testID="@popup/confirm-addresses"
                onPress={popupCall.exported ? onFinish : onConfirm}
            >
                <Translation id="moduleConnectPopup.confirm" />
            </Button>
        </VStack>
    );
};
