import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeSelectedQuote,
} from '@suite-common/trading';
import { Translation } from '@suite-native/intl';
import { type ConfirmingScreenFlowType, ScreenHeader } from '@suite-native/navigation';

export type ExchangeConfirmationHeaderProps = {
    flowType: ConfirmingScreenFlowType;
};

const HeaderTitle = ({
    flowType,
    symbol,
}: {
    flowType: ConfirmingScreenFlowType;
    symbol?: string;
}) => {
    if (!symbol) return '';

    switch (flowType) {
        case 'approve':
            return (
                <Translation
                    id="moduleTrading.tradingConfirmationScreen.approveHeaderTitle"
                    values={{ symbol: symbol ?? '' }}
                />
            );
        case 'revoke-and-approve':
        case 'revoke':
            return (
                <Translation
                    id="moduleTrading.tradingConfirmationScreen.revokeHeaderTitle"
                    values={{ symbol: symbol ?? '' }}
                />
            );
        default:
            return '';
    }
};

export const ExchangeConfirmationHeader = ({ flowType }: ExchangeConfirmationHeaderProps) => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);

    const symbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    return (
        <ScreenHeader
            title={<HeaderTitle flowType={flowType} symbol={symbol} />}
            closeActionType="close"
        />
    );
};
