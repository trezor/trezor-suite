import { useDispatch, useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import {
    cancelDiscoveryThunk,
    runDiscoveryThunk,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import {
    Box,
    Button,
    Card,
    Text,
    TextDivider,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { EmptyWalletSvg } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { EmptyWalletInfoSheet, PassphraseContentScreenWrapper } from '@suite-native/passphrase';
import { useAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const cardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderElevation0,
    borderWidth: utils.borders.widths.small,
    gap: utils.spacings.sp16,
}));

export const PassphraseEmptyWalletScreen = () => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const analytics = useAnalytics();
    const dispatch = useDispatch();

    const device = useSelector(selectSelectedDevice);

    const handleTryAgain = () => {
        if (device) {
            dispatch(cancelDiscoveryThunk(device));
            dispatch(
                startDiscoveryThunk({
                    device,
                    isAddingHiddenWallet: true,
                    isAddingExistingWallet: false,
                }),
            );
            dispatch(runDiscoveryThunk(device));
        }
        analytics.report({ type: events.passphraseTryAgainEvent.name });
    };

    return (
        <PassphraseContentScreenWrapper
            title={<Translation id="modulePassphrase.emptyPassphraseWallet.title" />}
        >
            <Card style={applyStyle(cardStyle)}>
                <VStack alignItems="center" spacing={0}>
                    <EmptyWalletSvg />
                    <Text variant="body-md-strong" textAlign="center">
                        <Translation id="modulePassphrase.emptyPassphraseWallet.confirmCard.description" />
                    </Text>
                </VStack>
                <Button
                    onPress={openModal}
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
                    <Text textAlign="center" variant="body-md-strong">
                        <Translation id="modulePassphrase.emptyPassphraseWallet.expectingPassphraseWallet.title" />
                    </Text>
                    <Text textAlign="center" color="textSubdued">
                        <Translation id="modulePassphrase.emptyPassphraseWallet.expectingPassphraseWallet.description" />
                    </Text>
                </VStack>
                <Box>
                    <Button intent="neutral" priority="secondary" onPress={handleTryAgain}>
                        <Translation id="modulePassphrase.emptyPassphraseWallet.expectingPassphraseWallet.button" />
                    </Button>
                </Box>
            </VStack>
            <EmptyWalletInfoSheet onCloseModal={closeModal} ref={bottomSheetRef} />
        </PassphraseContentScreenWrapper>
    );
};
