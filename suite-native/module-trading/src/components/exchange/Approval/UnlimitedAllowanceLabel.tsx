import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import { type TradingRootState, selectTradingCoinSymbolByCryptoId } from '@suite-common/trading';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type UnlimitedAllowanceLabelProps = {
    cryptoId: CryptoId;
};

export const UnlimitedAllowanceLabel = ({ cryptoId }: UnlimitedAllowanceLabelProps) => {
    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, cryptoId),
    );

    return (
        <Text variant="body-sm-strong">
            <Translation id="moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel" />
            {coinSymbol ? ` ${coinSymbol}` : ''}
        </Text>
    );
};
