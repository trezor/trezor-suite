import { useCallback, useMemo } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';

import { TradingType } from '@suite-common/trading';
import { HStack, IconButton, useBottomSheetModal } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { HeaderTab } from './HeaderTab';
import { tradingActions } from '../../../reducers';
import {
    selectActiveTradingType,
    selectIsTradingSellEnabled,
} from '../../../selectors/commonSelectors';
import { AdvancedSettingsSheet } from '../../settings/AdvancedSettingsSheet';

const useSelectedTab = () => {
    const dispatch = useDispatch();
    const activeTab = useSelector(selectActiveTradingType);

    const setActiveTab = useCallback(
        (tab: TradingType) => {
            dispatch(tradingActions.setActiveTradingType(tab));
        },
        [dispatch],
    );

    return { activeTab, setActiveTab };
};

const useTabsData = () => {
    const { translate } = useTranslate();

    const isSellEnabled = useSelector(selectIsTradingSellEnabled);

    return useMemo(() => {
        const tabs = [
            {
                key: 'buy',
                label: translate('moduleTrading.tradingScreen.tabs.buy'),
                icon: 'plus',
            },
            isSellEnabled && {
                key: 'sell',
                label: translate('moduleTrading.tradingScreen.tabs.sell'),
                icon: 'minus',
            },
            {
                key: 'exchange',
                label: translate('moduleTrading.tradingScreen.tabs.exchange'),
                icon: 'arrowsLeftRight',
            },
        ] as { key: TradingType; label: string; icon: IconName }[];

        return tabs.filter(Boolean);
    }, [translate, isSellEnabled]);
};

const tabsStyle = prepareNativeStyle(({ spacings }) => ({
    gap: spacings.sp12,
}));

export const HeaderTabs = () => {
    const { applyStyle } = useNativeStyles();
    const { activeTab, setActiveTab } = useSelectedTab();
    const data = useTabsData();
    const { translate } = useTranslate();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    return (
        <>
            <HStack justifyContent="space-between">
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    accessible={true}
                    contentContainerStyle={applyStyle(tabsStyle)}
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
                <IconButton
                    iconName="gear"
                    size="small"
                    colorScheme="tertiaryElevation0"
                    accessibilityLabel={translate('moduleTrading.tradingScreen.tabs.settings')}
                    onPress={() => openModal()}
                />
            </HStack>
            <AdvancedSettingsSheet ref={bottomSheetRef} closeModal={closeModal} />
        </>
    );
};
