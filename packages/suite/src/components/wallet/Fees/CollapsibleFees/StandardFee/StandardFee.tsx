import { BitcoinFeeCards } from './BitcoinFeeCards';
import { EthereumFeeCards } from './EthereumFeeCards';
import { type FeeCardAppearance } from './FeeCard';
import { MiscFeeCards } from './MiscFeeCards';
import { useNetworkFeeOptions } from './hooks/useNetworkFeeOptions';
import { useFeesContext } from '../../context/FeesContext';

export type StandardFeeProps = {
    feeCardAppearance?: FeeCardAppearance;
};

export const StandardFee = ({ feeCardAppearance }: StandardFeeProps) => {
    const { feeInfo, networkType, networkSymbol, selectedFeeLevel, composedLevels } =
        useFeesContext();

    const feeOptions = useNetworkFeeOptions({
        networkType,
        networkSymbol,
        levels: feeInfo.levels,
        composedLevels,
    });

    if (!selectedFeeLevel || !feeOptions.length) {
        return null;
    }

    switch (networkType) {
        case 'bitcoin':
            return (
                <BitcoinFeeCards feeOptions={feeOptions} feeCardAppearance={feeCardAppearance} />
            );

        case 'ethereum':
            return (
                <EthereumFeeCards feeOptions={feeOptions} feeCardAppearance={feeCardAppearance} />
            );

        case 'tron':
            return null;

        default:
            return <MiscFeeCards feeOptions={feeOptions} feeCardAppearance={feeCardAppearance} />;
    }
};
