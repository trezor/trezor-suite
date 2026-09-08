import { Translation, type TranslationKey } from '@suite/intl';
import { type TradingType } from '@suite-common/trading';
import { type IconComponent, SubTabs } from '@trezor/components';
import { MinusIcon, PlusIcon, RepeatIcon } from '@trezor/icons';

export type TradingTransactionsFilter = TradingType | 'all';

type TabItem = {
    id: TradingTransactionsFilter;
    icon?: IconComponent;
    translationId: TranslationKey;
};

type TradingTransactionsTabsProps = {
    activeFilter: TradingTransactionsFilter;
    onChange: (filter: TradingTransactionsFilter) => void;
};

const tabItems: TabItem[] = [
    {
        id: 'all',
        translationId: 'TR_TRADING_TRADE_HISTORY_TAB_ALL',
    },
    {
        id: 'exchange',
        icon: RepeatIcon,
        translationId: 'TR_TRADING_TRADE_HISTORY_TAB_SWAPS',
    },
    {
        id: 'buy',
        icon: PlusIcon,
        translationId: 'TR_TRADING_TRADE_HISTORY_TAB_BUYS',
    },
    {
        id: 'sell',
        icon: MinusIcon,
        translationId: 'TR_TRADING_TRADE_HISTORY_TAB_SELLS',
    },
];

export const TradingTransactionsTabs = ({
    activeFilter,
    onChange,
}: TradingTransactionsTabsProps) => (
    <SubTabs activeItemId={activeFilter} size="large">
        {tabItems.map(item => (
            <SubTabs.Item
                key={item.id}
                id={item.id}
                icon={item.icon}
                onClick={() => onChange(item.id)}
                data-testid={`@trading/transactions/tab/${item.id}`}
            >
                <Translation id={item.translationId} />
            </SubTabs.Item>
        ))}
    </SubTabs>
);
