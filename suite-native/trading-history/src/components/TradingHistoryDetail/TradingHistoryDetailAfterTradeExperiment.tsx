import { ExperimentId, ExperimentWrapper } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';

import { TradingHistoryDetailSurveyBanner } from './TradingHistoryDetailSurveyBanner';
import { TradingDetailFeedback } from '../TradeHistoryListItem/TradingDetailFeedback';

type TradingHistoryDetailAfterTradeExperimentProps = {
    type: TradingType;
    status?: string;
    provider?: string;
    id?: string;
    sendCurrency?: string;
    receiveCurrency?: string;
    country?: string;
};

export const TradingHistoryDetailAfterTradeExperiment = ({
    type,
    status,
    provider,
    id,
    sendCurrency,
    receiveCurrency,
    country,
}: TradingHistoryDetailAfterTradeExperimentProps) => (
    <ExperimentWrapper
        id={ExperimentId.tradingFeedbackForm}
        components={[
            { variant: 'A', element: <></> },
            {
                variant: 'B',
                element: (
                    <TradingDetailFeedback
                        type={type}
                        status={status}
                        provider={provider}
                        id={id}
                        sendCurrency={sendCurrency}
                        receiveCurrency={receiveCurrency}
                        country={country}
                    />
                ),
            },
            { variant: 'C', element: <TradingHistoryDetailSurveyBanner /> },
        ]}
    />
);
