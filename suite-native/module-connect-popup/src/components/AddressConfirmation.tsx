import { useDispatch, useSelector } from 'react-redux';

import {
    connectPopupActions,
    connectPopupVerifyAddressThunk,
    selectConnectPopupCall,
} from '@suite-common/connect-popup';
import { Button, Card, HStack, IconButton, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export const AddressConfirmation = () => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);

    const onFinish = () => {
        dispatch(connectPopupActions.finishCall());
    };
    const onVerify = (index: number) => {
        dispatch(connectPopupVerifyAddressThunk({ index }));
    };

    if (popupCall?.state !== 'address-confirmation') return null;

    return (
        <VStack testID="@popup/address-confirmation" spacing="sp16" flex={1}>
            <TitleHeader
                title={<Translation id="moduleConnectPopup.confirmAddress.title" />}
                subtitle={<Translation id="moduleConnectPopup.confirmAddress.message" />}
            />
            <Card>
                <VStack>
                    {popupCall.addresses.map((item, index) => (
                        <HStack
                            key={index}
                            alignItems="center"
                            justifyContent="space-between"
                            padding="sp8"
                        >
                            <Text variant="hint">{item.address}</Text>
                            <IconButton
                                size="small"
                                colorScheme={
                                    item.validated === 'valid' ? 'primary' : 'tertiaryElevation0'
                                }
                                iconName={
                                    item.validated === 'valid' ? 'checkCircle' : 'trezorDevices'
                                }
                                onPress={() => onVerify(index)}
                            />
                        </HStack>
                    ))}
                </VStack>
            </Card>

            <Button testID="@popup/confirm-addresses" onPress={onFinish}>
                <Translation id="moduleConnectPopup.confirm" />
            </Button>
        </VStack>
    );
};
