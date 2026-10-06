import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingType } from '@suite-common/trading';
import { Button, Card, Column, H3 } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

type TradingTransactionsTypeEmptyStateProps = {
    tradeType: TradingType;
    onShowAllTrades: () => void;
};

const getTitleId = (tradeType: TradingType): TranslationKey => {
    switch (tradeType) {
        case 'exchange':
            return 'TR_TRADING_TRADE_HISTORY_NO_SWAPS';
        case 'buy':
            return 'TR_TRADING_TRADE_HISTORY_NO_BUYS';
        case 'sell':
            return 'TR_TRADING_TRADE_HISTORY_NO_SELLS';
        default:
            return exhaustive(tradeType);
    }
};

export const TradingTransactionsTypeEmptyState = ({
    tradeType,
    onShowAllTrades,
}: TradingTransactionsTypeEmptyStateProps) => (
    <Card paddingType="none" data-testid="@trading/transactions/type-empty-state">
        <Column padding={32} alignItems="center" gap={20}>
            <H3>
                <Translation id={getTitleId(tradeType)} />
            </H3>
            <Button
                intent="neutral"
                priority="secondary"
                onClick={onShowAllTrades}
                data-testid="@trading/transactions/show-all-trades"
            >
                <Translation id="TR_TRADING_TRADE_HISTORY_SHOW_ALL" />
            </Button>
        </Column>
    </Card>
);
