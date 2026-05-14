import { BitcoinFeeCards } from './BitcoinFeeCards';
import { EthereumFeeCards } from './EthereumFeeCards';
import { MiscFeeCards } from './MiscFeeCards';
import { useNetworkFeeOptions } from './hooks/useNetworkFeeOptions';
import { useFeesContext } from '../../context/FeesContext';

export const StandardFee = () => {
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
            return <BitcoinFeeCards feeOptions={feeOptions} />;

        case 'ethereum':
            return <EthereumFeeCards feeOptions={feeOptions} />;

        case 'tron':
            return null;

        default:
            return <MiscFeeCards feeOptions={feeOptions} />;
    }
};
