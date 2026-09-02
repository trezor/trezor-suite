import { memo } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { CompactCryptoAmountFormatter } from '@suite-native/formatters';

import { selectAssetCryptoValue } from '../assetsSelectors';
import { type AssetsRootState } from '../types';

type CryptoAmountProps = { symbol: NetworkSymbol };

export const CryptoAmount = memo(({ symbol }: CryptoAmountProps) => {
    const cryptoValue = useSelector((state: AssetsRootState) =>
        selectAssetCryptoValue(state, symbol),
    );

    return (
        <CompactCryptoAmountFormatter
            value={cryptoValue}
            symbol={symbol}
            testID={`@assets/cryptoAmount/${symbol}`}
        />
    );
});

CryptoAmount.displayName = 'CryptoAmount';
