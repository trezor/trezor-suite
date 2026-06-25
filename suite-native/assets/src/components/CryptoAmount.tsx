import { useSelector } from 'react-redux';

import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { CryptoAmountFormatter } from '@suite-native/formatters';

import { selectAssetCryptoValue } from '../assetsSelectors';
import { type AssetsRootState } from '../types';

type CryptoAmountProps = { symbol: NetworkSymbol };

export const CryptoAmount = ({ symbol }: CryptoAmountProps) => {
    const cryptoValue = useSelector((state: AssetsRootState) =>
        selectAssetCryptoValue(state, symbol),
    );

    return (
        <CryptoAmountFormatter
            value={cryptoValue}
            symbol={symbol}
            // Every asset crypto amount is rounded to 8 decimals to prevent UI overflow.
            decimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
            testID={`@assets/cryptoAmount/${symbol}`}
        />
    );
};
