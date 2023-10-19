import { useSelector } from 'react-redux';

import { Screen } from '@suite-native/navigation';
import { selectIsPortfolioEmpty } from '@suite-common/wallet-core';

import { EmptyHomeRenderer } from '../components/EmptyHomeRenderer';
import { PortfolioContent } from '../components/PortfolioContent';
import { BiometricsBottomSheet } from '../components/BiometricsBottomSheet';

export const HomeScreen = () => {
    const isPortfolioEmpty = useSelector(selectIsPortfolioEmpty);

    return (
        <Screen>
            {isPortfolioEmpty ? <EmptyHomeRenderer /> : <PortfolioContent />}
            <BiometricsBottomSheet />
        </Screen>
    );
};
