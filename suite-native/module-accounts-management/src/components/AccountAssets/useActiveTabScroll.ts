import { useCallback, useEffect, useRef } from 'react';
import {
    type LayoutChangeEvent,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    type ScrollView,
} from 'react-native';

import { type AccountAssetsTab } from './AccountAssetsTabBar';

export const useActiveTabScroll = (activeTab: AccountAssetsTab) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const tabLayouts = useRef<Partial<Record<AccountAssetsTab, { x: number; width: number }>>>({});
    const scrollOffset = useRef(0);
    const visibleWidth = useRef(0);

    const scrollToSelectedTab = useCallback((tab: AccountAssetsTab) => {
        const layout = tabLayouts.current[tab];
        if (!layout) return;

        const { x, width } = layout;
        const offset = scrollOffset.current;
        const visible = visibleWidth.current;

        if (x < offset) {
            scrollViewRef.current?.scrollTo({ x, animated: true });
        } else if (x + width > offset + visible) {
            scrollViewRef.current?.scrollTo({ x: x + width - visible, animated: true });
        }
    }, []);

    const handleTabLayout = useCallback(
        (tab: AccountAssetsTab) =>
            ({ nativeEvent }: LayoutChangeEvent) => {
                tabLayouts.current[tab] = {
                    x: nativeEvent.layout.x,
                    width: nativeEvent.layout.width,
                };
            },
        [],
    );

    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffset.current = nativeEvent.contentOffset.x;
    }, []);

    const handleScrollViewLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
        visibleWidth.current = nativeEvent.layout.width;
    }, []);

    useEffect(() => {
        scrollToSelectedTab(activeTab);
    }, [activeTab, scrollToSelectedTab]);

    return { scrollViewRef, handleTabLayout, handleScroll, handleScrollViewLayout };
};
