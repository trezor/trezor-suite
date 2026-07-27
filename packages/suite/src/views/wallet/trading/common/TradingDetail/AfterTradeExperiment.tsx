import {
    type BuyTradeStatus,
    type ExchangeProviderInfo,
    type ExchangeTradeStatus,
    type SellTradeStatus,
} from 'invity-api';

import { ExperimentId, ExperimentWrapper } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';

import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';

import { TradingDetailFeedback } from './TradingDetailFeedback';
import { TradingDetailSurvey } from './TradingDetailSurvey';

interface AfterTradeExperimentProps {
    status: ExchangeTradeStatus | SellTradeStatus | BuyTradeStatus | undefined;
    type: TradingType;
    provider?: ExchangeProviderInfo['name'];
    id?: string;
    quoteAmounts: TradingGetCryptoQuoteAmountProps;
    country?: string;
}

export const AfterTradeExperiment = ({
    status,
    type,
    provider,
    id,
    quoteAmounts,
    country,
}: AfterTradeExperimentProps) => (
    <ExperimentWrapper
        id={ExperimentId.tradingFeedbackForm}
        components={[
            { variant: 'A', element: <></> },
            {
                variant: 'B',
                element: (
                    <TradingDetailFeedback
                        status={status}
                        type={type}
                        provider={provider}
                        id={id}
                        quoteAmounts={quoteAmounts}
                        country={country}
                    />
                ),
            },
            {
                variant: 'C',
                element: <TradingDetailSurvey />,
            },
        ]}
    />
);
