import { Alert, Share } from 'react-native';

import { useNavigation } from '@react-navigation/native';

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
    address: string;
    onVerifyAddress: () => Promise<void>;
};

type NavigationProp = StackNavigationProps<
    ReceiveStackParamList,
    ReceiveStackRoutes.ReceiveAddress
>;

export const ReceiveAddressActions = ({ address, onVerifyAddress }: ReceiveAddressActionsProps) => {
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
        openCopiedAddressBottomSheet();
    };

    const handleVerifyAddress = (source: ReceiveAddressVerificationSource) => {
        navigation.navigate(ReceiveStackRoutes.ReceiveAddressVerification, { source });
        void onVerifyAddress();
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
                        onPress={() => handleVerifyAddress(ReceiveAddressVerificationSource.Pasted)}
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
