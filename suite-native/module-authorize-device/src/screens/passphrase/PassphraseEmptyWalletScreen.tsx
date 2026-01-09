import { useDispatch, useSelector } from 'react-redux';

import {
    cancelDiscoveryThunk,
    runDiscoveryThunk,
    selectSelectedDevice,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import { EventType } from '@suite-native/analytics';
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
import { useLegacyAnalytics } from '@suite-native/services';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { EmptyWalletInfoSheet } from '../../components/passphrase/EmptyWalletInfoSheet';
import { PassphraseContentScreenWrapper } from '../../components/passphrase/PassphraseContentScreenWrapper';

const cardStyle = prepareNativeStyle(utils => ({
    borderColor: utils.colors.borderElevation0,
    borderWidth: utils.borders.widths.small,
    gap: utils.spacings.sp16,
}));

export const PassphraseEmptyWalletScreen = () => {
    const { applyStyle } = useNativeStyles();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
    const legacyAnalytics = useLegacyAnalytics();
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
        legacyAnalytics.report({ type: EventType.PassphraseTryAgain });
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
            <EmptyWalletInfoSheet onCloseModal={closeModal} ref={bottomSheetRef} />
        </PassphraseContentScreenWrapper>
    );
};
