import { useSelector } from 'react-redux';

import { selectIsSelectedDeviceImported } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';

import { ShowAddressButtons } from '../ShowAddressButtons';
import { UnverifiedAddressDevice } from './UnverifiedAddressDevice';
import { UnverifiedAddressWarning } from './UnverifiedAddressWarning';
import { ReceiveProgressStep } from '../../hooks/useReceiveProgressSteps';

type UnverifiedAddressSectionProps = {
    address: string;
    isCardanoAddress: boolean;
    onShowAddress: () => void;
    receiveProgressStep: ReceiveProgressStep;
};

export const UnverifiedAddress = ({
    address,
    isCardanoAddress,
    onShowAddress,
    receiveProgressStep,
}: UnverifiedAddressSectionProps) => {
    const isPortfolioTracker = useSelector(selectIsSelectedDeviceImported);
    const isPortfolioAddressShown =
        isPortfolioTracker && receiveProgressStep !== ReceiveProgressStep.ShownPortfolioAddress;

    return (
        <VStack spacing="medium">
            {isPortfolioAddressShown && <UnverifiedAddressWarning />}
            {!isPortfolioTracker && (
                <UnverifiedAddressDevice
                    address={address}
                    isCardanoAddress={isCardanoAddress}
                    receiveProgressStep={receiveProgressStep}
                />
            )}
            {receiveProgressStep === ReceiveProgressStep.ObfuscatedAddress && (
                <ShowAddressButtons onShowAddress={onShowAddress} />
            )}
        </VStack>
    );
};
