import { type ReactNode } from 'react';

import { type TradingType, selectTradingProviderByNameAndTradeType } from '@suite-common/trading';

import { useSelector } from '../../../../../hooks/suite';
import {
    TradingDetailContext,
    useTradingDetail,
} from '../../../../../hooks/wallet/trading/useTradingDetail';
import { TradingContainer } from '../TradingContainer';

type TradingDetailProps<T extends TradingType> = {
    tradeType: T;
    children: ReactNode;
};

export const TradingDetail = <T extends TradingType>({
    tradeType,
    children,
}: TradingDetailProps<T>) => {
    const tradingDetailContext = useTradingDetail({ tradeType });

    const provider = useSelector(reduxState =>
        selectTradingProviderByNameAndTradeType(
            reduxState,
            tradingDetailContext.trade?.data.exchange,
            tradeType,
        ),
    );

    return (
        <TradingDetailContext.Provider value={tradingDetailContext}>
            <TradingContainer provider={provider}>{children}</TradingContainer>
        </TradingDetailContext.Provider>
    );
};
