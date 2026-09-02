import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import { type TradingRootState, selectTradingCoinSymbolByCryptoId } from '@suite-common/trading';
import { isNetworkSymbol } from '@suite-common/wallet-config';
import type { TokenSymbol } from '@suite-common/wallet-types';
import type { TextProps } from '@suite-native/atoms';
import {
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';

export type TradingCoinAmountFormatterProps = TextProps & {
    cryptoId?: CryptoId;
    amount?: string;
};

export const TradingCoinAmountFormatter = ({
    amount,
    cryptoId,
    ...textProps
}: TradingCoinAmountFormatterProps) => {
    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, cryptoId),
    );

    if (!coinSymbol) {
        return null;
    }

    if (isNetworkSymbol(coinSymbol)) {
        return (
            <ExactCryptoAmountFormatter
                value={amount ?? '0'}
                symbol={coinSymbol}
                isBalance={false}
                isDiscreetText={false}
                {...textProps}
            />
        );
    }

    return (
        <ExactTokenAmountFormatter
            value={asDecimalTokenAmount(amount ?? '0')}
            tokenSymbol={coinSymbol as TokenSymbol}
            isDiscreetText={false}
            {...textProps}
        />
    );
};
