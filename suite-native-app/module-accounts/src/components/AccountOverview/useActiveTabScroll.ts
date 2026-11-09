import { useCallback, useEffect, useRef } from 'react';
import {
    type LayoutChangeEvent,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    type ScrollViewInstance,
} from 'react-native';

import { useNativeStyles } from '@trezor/styles-native';

import { type AccountOverviewTab } from './types';

export const useActiveTabScroll = (activeTab: AccountOverviewTab) => {
    const { utils } = useNativeStyles();
    const horizontalPadding = utils.spacings.sp16;
    const scrollViewRef = useRef<ScrollViewInstance>(null);
    const tabLayouts = useRef<Partial<Record<AccountOverviewTab, { x: number; width: number }>>>(
        {},
    );
    const scrollOffset = useRef(0);
    const visibleWidth = useRef(0);

    const scrollToSelectedTab = useCallback(
        (tab: AccountOverviewTab, animated = true) => {
            const layout = tabLayouts.current[tab];
            const visible = visibleWidth.current;
            if (!layout || visible === 0) {
                return;
            }

            const { x, width } = layout;
            const offset = scrollOffset.current;

            if (x - horizontalPadding < offset) {
                scrollViewRef.current?.scrollTo({
                    x: Math.max(x - horizontalPadding, 0),
                    animated,
                });
            } else if (x + width + horizontalPadding > offset + visible) {
                scrollViewRef.current?.scrollTo({
                    x: x + width + horizontalPadding - visible,
                    animated,
                });
            }
        },
        [horizontalPadding],
    );

    const handleTabLayout =
        (tab: AccountOverviewTab) =>
        ({ nativeEvent }: LayoutChangeEvent) => {
            tabLayouts.current[tab] = {
                x: nativeEvent.layout.x,
                width: nativeEvent.layout.width,
            };
            if (tab === activeTab) {
                scrollToSelectedTab(tab, false);
            }
        };

    const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffset.current = nativeEvent.contentOffset.x;
    };

    const handleScrollViewLayout = ({ nativeEvent }: LayoutChangeEvent) => {
        visibleWidth.current = nativeEvent.layout.width;
        scrollToSelectedTab(activeTab, false);
    };

    useEffect(() => {
        scrollToSelectedTab(activeTab);
    }, [activeTab, scrollToSelectedTab]);

    return { scrollViewRef, handleTabLayout, handleScroll, handleScrollViewLayout };
};
