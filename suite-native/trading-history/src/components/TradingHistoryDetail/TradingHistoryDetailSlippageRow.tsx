import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { ExplanationText, TradeInfoRow } from '@suite-native/trading-atoms';

const TEST_ID = '@trading/history/detail/info';

type TradingHistoryDetailSlippageRowProps = {
    swapSlippage: string;
};

export const TradingHistoryDetailSlippageRow = ({
    swapSlippage,
}: TradingHistoryDetailSlippageRowProps) => (
    <TradeInfoRow>
        <ExplanationText
            title={<Translation id="moduleTrading.tradeHistory.detail.info.maximumSlippage" />}
            description={
                <Translation id="moduleTrading.tradeHistory.detail.info.explanation.maximumSlippage.description" />
            }
            testID={`${TEST_ID}/slippage-explanation`}
        >
            <Translation id="moduleTrading.tradeHistory.detail.info.maximumSlippage" />
        </ExplanationText>
        <Text variant="body-sm">{swapSlippage}%</Text>
    </TradeInfoRow>
);
