import { type TradingType } from '@suite-common/trading';
import { EdgeFades, type SubTabItem, SubTabs } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNativeStyles } from '@trezor/styles-native';

export type TradingHistoryFilter = TradingType | 'all';

type TradingHistoryTabsProps = {
    value: TradingHistoryFilter;
    onChange: (value: TradingHistoryFilter) => void;
};

const items: SubTabItem<TradingHistoryFilter>[] = [
    {
        value: 'all',
        label: <Translation id="moduleTrading.tradeHistory.tabs.all" />,
        testID: '@trading/history/tab/all',
    },
    {
        value: 'exchange',
        label: <Translation id="moduleTrading.tradeHistory.tabs.exchange" />,
        icon: 'repeat',
        testID: '@trading/history/tab/exchange',
    },
    {
        value: 'buy',
        label: <Translation id="moduleTrading.tradeHistory.tabs.buy" />,
        icon: 'plus',
        testID: '@trading/history/tab/buy',
    },
    {
        value: 'sell',
        label: <Translation id="moduleTrading.tradeHistory.tabs.sell" />,
        icon: 'minus',
        testID: '@trading/history/tab/sell',
    },
];

export const TradingHistoryTabs = ({ value, onChange }: TradingHistoryTabsProps) => {
    const { utils } = useNativeStyles();

    return (
        <>
            <SubTabs
                items={items}
                onChange={onChange}
                paddingHorizontal="sp16"
                size="large"
                testID="@trading/history/tabs"
                value={value}
            />
            <EdgeFades direction="horizontal" startSize={utils.spacings.sp20} />
        </>
    );
};
