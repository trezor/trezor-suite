import {
    BottomSheetModal,
    Button,
    IconListTextItem,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';

type WalletEntropyLearnMoreLinkProps = {
    label: React.ReactNode;
};

export const WalletEntropyLearnMoreLink = ({ label }: WalletEntropyLearnMoreLinkProps) => {
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <>
            <Link label={label} textVariant="body-sm" isUnderlined onPress={openModal} />
            <BottomSheetModal
                ref={bottomSheetRef}
                title={
                    <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.walletEntropyInfo.title" />
                }
            >
                <VStack spacing="sp24">
                    <VStack spacing="sp16">
                        <IconListTextItem
                            icon="encryptionKey"
                            iconSize="large"
                            verticalAlign="flex-start"
                        >
                            <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.walletEntropyInfo.bullet1" />
                        </IconListTextItem>
                        <IconListTextItem
                            icon="dualCpu"
                            iconSize="large"
                            verticalAlign="flex-start"
                        >
                            <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.walletEntropyInfo.bullet2" />
                        </IconListTextItem>
                        <IconListTextItem
                            icon="eggCrack"
                            iconSize="large"
                            verticalAlign="flex-start"
                        >
                            <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.walletEntropyInfo.bullet3" />
                        </IconListTextItem>
                        <IconListTextItem icon="wallet" iconSize="large" verticalAlign="flex-start">
                            <Translation id="moduleDeviceOnboarding.recoveryInstructionsScreen.walletEntropyInfo.bullet4" />
                        </IconListTextItem>
                    </VStack>
                    <Button onPress={closeModal}>
                        <Translation id="generic.buttons.gotIt" />
                    </Button>
                </VStack>
            </BottomSheetModal>
        </>
    );
};
