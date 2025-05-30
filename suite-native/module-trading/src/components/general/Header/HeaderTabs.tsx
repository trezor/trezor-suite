import { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';

import { TradingType } from '@suite-common/trading';
import { IconName } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';

import { HeaderTab } from './HeaderTab';
import { selectActiveTradingType } from '../../../selectors/commonSelectors';
import { setActiveTradingType } from '../../../tradingSlice';

const useSelectedTab = () => {
    const dispatch = useDispatch();
    const activeTab = useSelector(selectActiveTradingType);

    const setActiveTab = useCallback(
        (tab: TradingType) => {
            dispatch(setActiveTradingType(tab));
        },
        [dispatch],
    );

    return { activeTab, setActiveTab };
};

const useTabsData = () => {
    const { translate } = useTranslate();

    return useMemo(
        () =>
            [
                {
                    key: 'buy',
                    label: translate('moduleTrading.tradingScreen.tabs.buy'),
                    icon: 'plus',
                },
                {
                    key: 'exchange',
                    label: translate('moduleTrading.tradingScreen.tabs.exchange'),
                    icon: 'arrowsLeftRight',
                },
            ] as { key: TradingType; label: string; icon: IconName }[],
        [translate],
    );
};

export const HeaderTabs = () => {
    const { activeTab, setActiveTab } = useSelectedTab();
    const data = useTabsData();

    return (
        <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            accessible={true}
            renderItem={({ item }) => (
                <HeaderTab
                    icon={item.icon}
                    active={item.key === activeTab}
                    onPress={() => setActiveTab(item.key)}
                >
                    {item.label}
                </HeaderTab>
            )}
            data={data}
            extraData={activeTab}
        />
    );
};
