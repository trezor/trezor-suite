import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { ExplanationText, TradeInfoRow } from '@suite-native/trading-atoms';

const TEST_ID = '@trading/history/detail/info';

type TradingHistoryDetailMevProtectionRowProps = {
    isMevProtectionEnabled: boolean;
};

export const TradingHistoryDetailMevProtectionRow = ({
    isMevProtectionEnabled,
}: TradingHistoryDetailMevProtectionRowProps) => (
    <TradeInfoRow>
        <ExplanationText
            title={<Translation id="moduleTrading.tradeHistory.detail.info.mevProtection" />}
            description={
                <Translation id="moduleTrading.tradeHistory.detail.info.explanation.mevProtection.description" />
            }
            testID={`${TEST_ID}/mev-explanation`}
        >
            <Translation id="moduleTrading.tradeHistory.detail.info.mevProtection" />
        </ExplanationText>
        <Icon
            color="contentPrimary"
            name={isMevProtectionEnabled ? 'check' : 'x'}
            size="large"
            testID={`${TEST_ID}/mev-${isMevProtectionEnabled ? 'enabled' : 'disabled'}`}
        />
    </TradeInfoRow>
);
