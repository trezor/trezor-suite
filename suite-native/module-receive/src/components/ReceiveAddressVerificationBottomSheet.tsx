import {
    BottomSheetListItem,
    BottomSheetModal,
    type BottomSheetModalRef,
    Button,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ReceiveAddressVerificationSource } from '@suite-native/navigation';

type ReceiveAddressVerificationBottomSheetProps = {
    ref: BottomSheetModalRef;
    source: ReceiveAddressVerificationSource;
    onVerifyAddress: () => void;
    onSkipVerification: () => void;
};

export const ReceiveAddressVerificationBottomSheet = ({
    ref,
    source,
    onVerifyAddress,
    onSkipVerification,
}: ReceiveAddressVerificationBottomSheetProps) => {
    const isSharedAddress = source === ReceiveAddressVerificationSource.Shared;

    return (
        <BottomSheetModal ref={ref}>
            <VStack spacing="sp32">
                <VStack spacing={isSharedAddress ? 'sp12' : 0} alignItems="center">
                    <Text variant="headline-sm" textAlign="center">
                        <Translation
                            id={
                                isSharedAddress
                                    ? 'moduleReceive.addressSharedBottomSheet.title'
                                    : 'moduleReceive.addressCopiedBottomSheet.title'
                            }
                        />
                    </Text>
                    <Text variant={isSharedAddress ? 'body-md' : 'headline-sm'} textAlign="center">
                        <Translation
                            id={
                                isSharedAddress
                                    ? 'moduleReceive.addressSharedBottomSheet.subtitle'
                                    : 'moduleReceive.addressCopiedBottomSheet.subtitle'
                            }
                        />
                    </Text>
                </VStack>
                {!isSharedAddress && (
                    <VStack spacing="sp20">
                        <BottomSheetListItem
                            iconNumber={1}
                            translationKey="moduleReceive.addressCopiedBottomSheet.steps.pasteAddress"
                        />
                        <BottomSheetListItem
                            iconNumber={2}
                            translationKey="moduleReceive.addressCopiedBottomSheet.steps.verifyAddress"
                        />
                    </VStack>
                )}
                <VStack spacing="sp12">
                    <Button
                        testID={`@receive/address-verification/${source}/verify-button`}
                        onPress={onVerifyAddress}
                        isFullWidth
                    >
                        <Translation id="moduleReceive.addressCopiedBottomSheet.buttons.verifyOnTrezor" />
                    </Button>
                    <Button
                        intent="neutral"
                        priority="secondary"
                        onPress={onSkipVerification}
                        isFullWidth
                    >
                        <Translation id="moduleReceive.addressCopiedBottomSheet.buttons.skipVerification" />
                    </Button>
                </VStack>
            </VStack>
        </BottomSheetModal>
    );
};
