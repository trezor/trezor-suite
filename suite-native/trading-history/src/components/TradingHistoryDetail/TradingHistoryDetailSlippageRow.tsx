import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { SLIPPAGE_PERCENT_FORMAT_OPTIONS } from '@suite-common/trading';
import { Text } from '@suite-native/atoms';
import { Translation, selectLocale } from '@suite-native/intl';
import { ExplanationText, TradeInfoRow } from '@suite-native/trading-atoms';

const TEST_ID = '@trading/history/detail/info';

type TradingHistoryDetailSlippageRowProps = {
    swapSlippage: string;
};

export const TradingHistoryDetailSlippageRow = ({
    swapSlippage,
}: TradingHistoryDetailSlippageRowProps) => {
    const locale = useSelector(selectLocale);

    const percentFormatter = useMemo(
        () => new Intl.NumberFormat(locale, SLIPPAGE_PERCENT_FORMAT_OPTIONS),
        [locale],
    );

    const formattedSlippage = percentFormatter.format(Number(swapSlippage) / 100);

    return (
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
            <Text variant="body-sm">{formattedSlippage}</Text>
        </TradeInfoRow>
    );
};
