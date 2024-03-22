import React from 'react';
import { useSelector } from 'react-redux';

import { VStack, TextButton, Button } from '@suite-native/atoms';
import { useOpenLink } from '@suite-native/link';
import { Translation } from '@suite-native/intl';
import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';

type ShowAddressButtonsProps = {
    onShowAddress: () => void;
};

export const ShowAddressButtons = ({ onShowAddress }: ShowAddressButtonsProps) => {
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const openLink = useOpenLink();

    const handleOpenEduLink = () => {
        openLink('https://trezor.io/learn/a/verifying-trezor-suite-lite-addresses');
    };

    return (
        <VStack spacing="large">
            <Button iconLeft="eye" size="large" onPress={onShowAddress}>
                <Translation
                    id={
                        isPortfolioTrackerDevice
                            ? 'moduleReceive.receiveAddressCard.showAddress.buttonTracker'
                            : 'moduleReceive.receiveAddressCard.showAddress.button'
                    }
                />
            </Button>
            <TextButton size="small" onPress={handleOpenEduLink} iconRight="arrowUpRight">
                <Translation id="moduleReceive.receiveAddressCard.showAddress.learnMore" />
            </TextButton>
        </VStack>
    );
};
