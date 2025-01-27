import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';
import { Box, Button, Card, Text, TextDivider, VStack } from '@suite-native/atoms';
import { retryPassphraseAuthenticationThunk } from '@suite-native/device-authorization';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToTabCompositeProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { EmptyWalletSvg } from '../../assets/passphrase/EmptyWalletSvg';
import { EmptyWalletInfoSheet } from '../../components/passphrase/EmptyWalletInfoSheet';
import { PassphraseContentScreenWrapper } from '../../components/passphrase/PassphraseContentScreenWrapper';

const cardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderElevation0,
    borderWidth: utils.borders.widths.small,
    gap: utils.spacings.sp16,
}));

type NavigationProp = StackToTabCompositeProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const PassphraseEmptyWalletScreen = () => {
    const { applyStyle } = useNativeStyles();

    const dispatch = useDispatch();

    const device = useSelector(selectSelectedDevice);

    const navigation = useNavigation<NavigationProp>();

    const [isSheetVisible, setIsSheetVisible] = useState(false);

    const toggleBottomSheet = () => {
        setIsSheetVisible(!isSheetVisible);
    };

    const handleTryAgain = () => {
        navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseForm);
        dispatch(
            deviceActions.removeButtonRequests({
                device,
                buttonRequestCode: 'ButtonRequest_Other',
            }),
        );
        dispatch(retryPassphraseAuthenticationThunk());
        analytics.report({ type: EventType.PassphraseTryAgain });
    };

    return (
        <PassphraseContentScreenWrapper
            title={<Translation id="modulePassphrase.emptyPassphraseWallet.title" />}
        >
            <Card style={applyStyle(cardStyle)}>
                <VStack alignItems="center" spacing={0}>
                    <EmptyWalletSvg />
                    <Text variant="highlight" textAlign="center">
                        <Translation id="modulePassphrase.emptyPassphraseWallet.confirmCard.description" />
                    </Text>
                </VStack>
                <Button
                    onPress={toggleBottomSheet}
                    testID="@passphrase/emptyPassphraseWallet/confirmButton"
                >
                    <Translation id="modulePassphrase.emptyPassphraseWallet.confirmCard.button" />
                </Button>
            </Card>
            <TextDivider
                title="generic.orSeparator"
                lineColor="borderElevation0"
                textColor="textSubdued"
            />
            <VStack marginHorizontal="sp16" spacing="sp16">
                <VStack alignItems="center" spacing="sp4">
                    <Text textAlign="center" variant="highlight">
                        <Translation id="modulePassphrase.emptyPassphraseWallet.expectingPassphraseWallet.title" />
                    </Text>
                    <Text textAlign="center" color="textSubdued">
                        <Translation id="modulePassphrase.emptyPassphraseWallet.expectingPassphraseWallet.description" />
                    </Text>
                </VStack>
                <Box>
                    <Button colorScheme="tertiaryElevation0" onPress={handleTryAgain}>
                        <Translation id="modulePassphrase.emptyPassphraseWallet.expectingPassphraseWallet.button" />
                    </Button>
                </Box>
            </VStack>
            <EmptyWalletInfoSheet isVisible={isSheetVisible} onClose={toggleBottomSheet} />
        </PassphraseContentScreenWrapper>
    );
};
