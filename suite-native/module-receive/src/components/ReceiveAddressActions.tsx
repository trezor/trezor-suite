import { Alert, Share } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { type AccountKey } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Button, HStack, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    ReceiveAddressVerificationSource,
    type ReceiveStackParamList,
    ReceiveStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { ReceiveAddressVerificationBottomSheet } from './ReceiveAddressVerificationBottomSheet';

type ReceiveAddressActionsProps = {
    accountKey: AccountKey;
    address: string;
    addressPath: string;
};

type NavigationProp = StackNavigationProps<ReceiveStackParamList, ReceiveStackRoutes>;

export const ReceiveAddressActions = ({
    accountKey,
    address,
    addressPath,
}: ReceiveAddressActionsProps) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const copyToClipboard = useCopyToClipboard();
    const navigation = useNavigation<NavigationProp>();
    const { translate } = useTranslate();
    const {
        bottomSheetRef: copiedAddressBottomSheetRef,
        openModal: openCopiedAddressBottomSheet,
        closeModal: closeCopiedAddressBottomSheet,
    } = useBottomSheetModal();
    const {
        bottomSheetRef: sharedAddressBottomSheetRef,
        openModal: openSharedAddressBottomSheet,
        closeModal: closeSharedAddressBottomSheet,
    } = useBottomSheetModal();

    const handleCopyAddress = async () => {
        await copyToClipboard(address, translate('qrCode.addressCopied'));
        analytics.report({ type: events.receiveCopyAddressEvent.name });
        openCopiedAddressBottomSheet();
    };

    const handleVerifyAddress = (source: ReceiveAddressVerificationSource) => {
        analytics.report({ type: events.receiveStartVerificationEvent.name });
        navigation.navigate(ReceiveStackRoutes.ReceiveAddressVerification, {
            accountKey,
            addressPath,
            source,
        });
    };

    const handleVerifyCopiedAddress = () => {
        closeCopiedAddressBottomSheet();
        handleVerifyAddress(ReceiveAddressVerificationSource.Pasted);
    };

    const handleVerifySharedAddress = () => {
        closeSharedAddressBottomSheet();
        handleVerifyAddress(ReceiveAddressVerificationSource.Shared);
    };

    const handleShareData = async () => {
        try {
            const { action } = await Share.share({
                message: address,
            });

            if (action === Share.dismissedAction) {
                return;
            }

            analytics.report({ type: events.receiveShareAddressEvent.name });
            openSharedAddressBottomSheet();
        } catch (error) {
            Alert.alert('Something went wrong.', error.message);
        }
    };

    return (
        <>
            <VStack spacing="sp8">
                <Button iconLeft="copy" onPress={handleCopyAddress} isFullWidth>
                    <Translation id="qrCode.copyButton" />
                </Button>
                <HStack spacing="sp8">
                    <Button
                        iconLeft="shareNetwork"
                        intent="neutral"
                        priority="secondary"
                        onPress={handleShareData}
                        flex={1}
                    >
                        <Translation id="qrCode.shareButton" />
                    </Button>
                    <Button
                        iconLeft="trezorDevices"
                        intent="neutral"
                        priority="secondary"
                        onPress={() =>
                            handleVerifyAddress(ReceiveAddressVerificationSource.Verified)
                        }
                        flex={1}
                    >
                        <Translation id="moduleReceive.addressActions.verify" />
                    </Button>
                </HStack>
            </VStack>
            <ReceiveAddressVerificationBottomSheet
                ref={copiedAddressBottomSheetRef}
                source={ReceiveAddressVerificationSource.Pasted}
                onVerifyAddress={handleVerifyCopiedAddress}
                onSkipVerification={closeCopiedAddressBottomSheet}
            />
            <ReceiveAddressVerificationBottomSheet
                ref={sharedAddressBottomSheetRef}
                source={ReceiveAddressVerificationSource.Shared}
                onVerifyAddress={handleVerifySharedAddress}
                onSkipVerification={closeSharedAddressBottomSheet}
            />
        </>
    );
};
