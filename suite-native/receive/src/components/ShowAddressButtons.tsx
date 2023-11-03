import React from 'react';

import { useAtomValue } from 'jotai';

import { VStack, TextButton, Button } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';
import { useTranslate } from '@suite-native/intl';

import {
    isVerificationWalkthroughEnabledAtom,
    VerificationWalkthroughBottomSheet,
} from './VerificationWalkthroughBottomSheet';

type ShowAddressButtonsProps = {
    onShowAddress: () => void;
};

export const ShowAddressButtons = ({ onShowAddress }: ShowAddressButtonsProps) => {
    const isVerificationWalkthroughEnabled = useAtomValue(isVerificationWalkthroughEnabledAtom);

    const openLink = useOpenLink();
    const { translate } = useTranslate();

    const [isWalkthroughSheetOpened, setIsWalkthroughSheetOpened] = React.useState(false);

    const handleOpenEduLink = () => {
        openLink('https://trezor.io/learn/a/verifying-trezor-suite-lite-addresses');
    };

    const handlePressShowAddressButton = () => {
        if (isVerificationWalkthroughEnabled) {
            setIsWalkthroughSheetOpened(true);
            return;
        }
        onShowAddress();
    };

    return (
        <>
            <VStack spacing="large">
                <Button
                    iconLeft="eye"
                    size="large"
                    onPress={handlePressShowAddressButton}
                    testID="@receive/showAddressBtn"
                >
                    {translate('moduleReceive.receiveAddressCard.showAddress.button')}
                </Button>
                <TextButton size="small" onPress={handleOpenEduLink} iconRight="arrowUpRight">
                    {translate('moduleReceive.receiveAddressCard.showAddress.learnMore')}
                </TextButton>
            </VStack>
            <VerificationWalkthroughBottomSheet
                isOpened={isWalkthroughSheetOpened}
                onClose={onShowAddress}
            />
        </>
    );
};
