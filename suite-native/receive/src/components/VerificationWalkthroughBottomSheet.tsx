import { useMemo, useState } from 'react';
import { Dimensions, useColorScheme } from 'react-native';

import { useSetAtom } from 'jotai';

import { BottomSheet, Button, Image, VStack, Box } from '@suite-native/atoms';
import { atomWithUnecryptedStorage } from '@suite-native/storage';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ReceiveAddressBottomSheetHeader } from './ReceiveAddressBottomSheetHeader';

export const isVerificationWalkthroughEnabledAtom = atomWithUnecryptedStorage<boolean>(
    'isVerificationWalkthroughEnabled',
    true,
);

const SCREEN_HEIGHT = Dimensions.get('screen').height;

const imageStyle = prepareNativeStyle(() => ({
    height: 322,
    maxHeight: SCREEN_HEIGHT * 0.45,
}));

const imageStyle2 = prepareNativeStyle(() => ({
    height: 229,
    maxHeight: SCREEN_HEIGHT * 0.45,
}));

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
    const colorScheme = useColorScheme();
    const { applyStyle } = useNativeStyles();
    const [activeStep, setActiveStep] = useState<WalkthroughStep>(1);

    const image = useMemo(() => {
        if (colorScheme === 'dark') {
            return require('../../assets/darkCheck.png');
        }
        return require('../../assets/check.png');
    }, [colorScheme]);

    const image2 = useMemo(() => {
        if (colorScheme === 'dark') {
            return require('../../assets/darkTrezorTruth.png');
        }
        return require('../../assets/trezorTruth.png');
    }, [colorScheme]);

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
                <Box flexDirection="row" flex={1}>
                    <VStack flex={1} spacing="large">
                        <Image
                            source={activeStep === 1 ? image : image2}
                            style={applyStyle(activeStep === 1 ? imageStyle : imageStyle2)}
                            contentFit="contain"
                        />
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
                            <Button onPress={handlePressContinue}>
                                {translate('generic.buttons.continue')}
                            </Button>
                        </VStack>
                    </VStack>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
