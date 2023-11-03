import { useSelector } from 'react-redux';

import { selectIsSelectedDeviceImported } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';

import { ShowAddressButtons } from './ShowAddressButtons';
import { UnverifiedAddressDevice } from './UnverifiedAddressDevice';
import { UnverifiedAddressWarning } from './UnverifiedAddressWarning';

type UnverifiedAddressSectionProps = {
    address: string;
    isAddressRevealed: boolean;
    onShowAddress: () => void;
};

export const UnverifiedAddress = ({
    address,
    isAddressRevealed,
    onShowAddress,
}: UnverifiedAddressSectionProps) => {
    const isPortfolioTracker = useSelector(selectIsSelectedDeviceImported);

    return (
        <VStack spacing="medium">
            {isPortfolioTracker ? (
                <UnverifiedAddressWarning />
            ) : (
                <UnverifiedAddressDevice address={address} isAddressRevealed={isAddressRevealed} />
            )}
            {!isAddressRevealed && <ShowAddressButtons onShowAddress={onShowAddress} />}
        </VStack>
    );
};
