import { useSelector } from 'react-redux';

import { selectIsSelectedDeviceImported } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';

import { ShowAddressButtons } from './ShowAddressButtons';
import { UnverifiedAddressDevice } from './UnverifiedAddressDevice';
import { UnverifiedAddressWarning } from './UnverifiedAddressWarning';

type UnverifiedAddressSectionProps = {
    address: string;
    isAddressRevealed: boolean;
    isCardanoAddress: boolean;
    onShowAddress: () => void;
};

export const UnverifiedAddress = ({
    address,
    isAddressRevealed,
    isCardanoAddress,
    onShowAddress,
}: UnverifiedAddressSectionProps) => {
    const isPortfolioTracker = useSelector(selectIsSelectedDeviceImported);

    return (
        <VStack spacing="medium">
            {isPortfolioTracker ? (
                <UnverifiedAddressWarning />
            ) : (
                <UnverifiedAddressDevice
                    address={address}
                    isAddressRevealed={isAddressRevealed}
                    isCardanoAddress={isCardanoAddress}
                />
            )}
            {!isAddressRevealed && <ShowAddressButtons onShowAddress={onShowAddress} />}
        </VStack>
    );
};
