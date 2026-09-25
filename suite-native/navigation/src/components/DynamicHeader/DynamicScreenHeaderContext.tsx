import { type ReactNode, createContext, useCallback, useContext, useState } from 'react';
import { type ScrollEvent } from 'react-native';

import { throwError } from '@trezor/utils';

type HeaderContextType = {
    setScrollableHeaderHeight: (height: number) => void;
    isScrollableHeaderScrolled: boolean;
    handleDynamicHeaderScroll: (e: ScrollEvent) => void;
};

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

type HeaderProviderProps = {
    children: ReactNode;
    scrollThreshold?: number;
};

export const DynamicHeaderProvider = ({ children, scrollThreshold }: HeaderProviderProps) => {
    const [isScrollableHeaderScrolled, setIsScrollableHeaderScrolled] = useState(false);
    const [scrollableHeaderHeight, setScrollableHeaderHeight] = useState(0);

    const handleDynamicHeaderScroll = useCallback(
        ({ nativeEvent }: ScrollEvent) => {
            const isOffsetBigger =
                nativeEvent.contentOffset.y > scrollableHeaderHeight * (scrollThreshold ?? 1);
            setIsScrollableHeaderScrolled(isOffsetBigger);
        },
        [scrollThreshold, scrollableHeaderHeight],
    );

    return (
        <HeaderContext.Provider
            value={{
                setScrollableHeaderHeight,
                handleDynamicHeaderScroll,
                isScrollableHeaderScrolled,
            }}
        >
            {children}
        </HeaderContext.Provider>
    );
};

export const useDynamicHeader = () =>
    useContext(HeaderContext) ??
    throwError('useDynamicHeader must be used within a HeaderProvider');
