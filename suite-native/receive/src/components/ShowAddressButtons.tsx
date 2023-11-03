import React from 'react';

import { VStack, TextButton, Button } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';
import { useTranslate } from '@suite-native/intl';

type ShowAddressButtonsProps = {
    onShowAddress: () => void;
};

export const ShowAddressButtons = ({ onShowAddress }: ShowAddressButtonsProps) => {
    const openLink = useOpenLink();
    const { translate } = useTranslate();

    const handleOpenEduLink = () => {
        openLink('https://trezor.io/learn/a/verifying-trezor-suite-lite-addresses');
    };
    return (
        <VStack spacing="large">
            <Button iconLeft="eye" size="large" onPress={onShowAddress}>
                {translate('moduleReceive.receiveAddressCard.showAddress.button')}
            </Button>
            <TextButton size="small" onPress={handleOpenEduLink} iconRight="arrowUpRight">
                {translate('moduleReceive.receiveAddressCard.showAddress.learnMore')}
            </TextButton>
        </VStack>
    );
};
