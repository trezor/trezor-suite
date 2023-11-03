import { useState } from 'react';

import { useSetAtom } from 'jotai';

import { BottomSheet, Button, VStack, Box } from '@suite-native/atoms';
import { atomWithUnecryptedStorage } from '@suite-native/storage';
import { useTranslate } from '@suite-native/intl';

import { ReceiveAddressBottomSheetHeader } from './ReceiveAddressBottomSheetHeader';

export const isVerificationWalkthroughEnabledAtom = atomWithUnecryptedStorage<boolean>(
    'isVerificationWalkthroughEnabled',
    true,
);

type WalkthroughStep = 1 | 2;

export const VerificationWalkthroughBottomSheet = ({
    isOpened,
    onClose,
}: {
    isOpened: boolean;
    onClose: () => void;
}) => {
    const { translate } = useTranslate();
    const setIsVerificationWalkthroughEnabled = useSetAtom(isVerificationWalkthroughEnabledAtom);
    const [activeStep, setActiveStep] = useState<WalkthroughStep>(1);

    const handlePressContinue = () => {
        if (activeStep === 1) {
            setActiveStep(2);
            return;
        }
        onClose();
    };

    const handlePressDontShowAgain = () => {
        setIsVerificationWalkthroughEnabled(false);
        onClose();
    };

    return (
        <BottomSheet
            isVisible={isOpened}
            onClose={onClose}
            isCloseDisplayed={false}
            paddingHorizontal="large"
        >
            <VStack spacing="large">
                <ReceiveAddressBottomSheetHeader
                    title={translate(
                        `moduleReceive.bottomSheets.verificationWalkthrough.title.step${activeStep}`,
                    )}
                    description={translate(
                        `moduleReceive.bottomSheets.verificationWalkthrough.description.step${activeStep}`,
                    )}
                />

                {/* TODO: images will be added in issue: https://github.com/trezor/trezor-suite/issues/9777 */}

                <Box flexDirection="row" flex={1}>
                    <VStack flex={1} spacing="medium">
                        {activeStep === 2 && (
                            <Button
                                colorScheme="tertiaryElevation0"
                                onPress={handlePressDontShowAgain}
                            >
                                {translate(
                                    'moduleReceive.bottomSheets.verificationWalkthrough.dontShowAgainButton',
                                )}
                            </Button>
                        )}
                        <Button onPress={handlePressContinue} testID="@receive/continue">
                            {translate('generic.buttons.continue')}
                        </Button>
                    </VStack>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
