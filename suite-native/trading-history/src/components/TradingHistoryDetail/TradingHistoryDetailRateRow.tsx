import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ExplanationText, TradeInfoRow } from '@suite-native/trading-atoms';

import { type TradingHistoryDetailRateType } from '../../hooks/useTradingHistoryDetailInfo';

const TEST_ID = '@trading/history/detail/info';

type TradingHistoryDetailRateRowProps = {
    rateType: TradingHistoryDetailRateType;
};

export const TradingHistoryDetailRateRow = ({ rateType }: TradingHistoryDetailRateRowProps) => (
    <TradeInfoRow>
        <Text color="contentSecondary" variant="body-sm">
            <Translation id="moduleTrading.tradeHistory.detail.info.rate" />
        </Text>
        <ExplanationText
            priority="primary"
            title={
                <Translation
                    id={
                        rateType === 'fixed'
                            ? 'moduleTrading.tradeHistory.detail.info.explanation.fixedRate.title'
                            : 'moduleTrading.tradeHistory.detail.info.explanation.floatingRate.title'
                    }
                />
            }
            description={
                <Translation
                    id={
                        rateType === 'fixed'
                            ? 'moduleTrading.tradeHistory.detail.info.explanation.fixedRate.description'
                            : 'moduleTrading.tradeHistory.detail.info.explanation.floatingRate.description'
                    }
                />
            }
            testID={`${TEST_ID}/rate`}
        >
            <Translation
                id={
                    rateType === 'fixed'
                        ? 'moduleTrading.tradeHistory.detail.info.fixed'
                        : 'moduleTrading.tradeHistory.detail.info.floating'
                }
            />
        </ExplanationText>
    </TradeInfoRow>
);
