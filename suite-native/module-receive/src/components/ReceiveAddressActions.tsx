import { Button, HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ReceiveAddressVerificationSource } from '@suite-native/navigation';

import { useReceiveAddressInteractions } from './ReceiveAddressInteractionsProvider';
import { ReceiveAddressVerificationBottomSheet } from './ReceiveAddressVerificationBottomSheet';
import { useReceiveAddressSharing } from '../hooks/useReceiveAddressSharing';

type ReceiveAddressActionsProps = {
    address: string;
};

export const ReceiveAddressActions = ({ address }: ReceiveAddressActionsProps) => {
    const { handleCopyAddress, handleVerifyAddress } = useReceiveAddressInteractions();
    const {
        sharedAddressBottomSheetRef,
        closeSharedAddressBottomSheet,
        handleShareAddress,
        handleVerifySharedAddress,
    } = useReceiveAddressSharing({ address, onVerifyAddress: handleVerifyAddress });

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
                        onPress={handleShareAddress}
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
                ref={sharedAddressBottomSheetRef}
                source={ReceiveAddressVerificationSource.Shared}
                onVerifyAddress={handleVerifySharedAddress}
                onSkipVerification={closeSharedAddressBottomSheet}
            />
        </>
    );
};
