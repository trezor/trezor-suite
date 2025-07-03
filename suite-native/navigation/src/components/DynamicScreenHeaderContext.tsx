import { ReactNode, createContext, useCallback, useContext, useState } from 'react';

import { NativeScrollEvent } from 'react-native/Libraries/Components/ScrollView/ScrollView';
import { NativeSyntheticEvent } from 'react-native/Libraries/Types/CoreEventTypes';

type HeaderContextType = {
    isHeaderVisible: boolean;
    setIsHeaderVisible: (visible: boolean) => void;
    setScrollableHeaderHeight: (height: number) => void;
    scrollableHeaderHeight: number;
    isScrolled: boolean;
    handleDynamicHeaderScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

type HeaderProviderProps = {
    children: ReactNode;
};

export const HeaderProvider = ({ children }: HeaderProviderProps) => {
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const [scrollableHeaderHeight, setScrollableHeaderHeight] = useState(0);

    const handleDynamicHeaderScroll = useCallback(
        ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
            const isOffsetBigger = nativeEvent.contentOffset.y > scrollableHeaderHeight;
            setIsScrolled(isOffsetBigger);
        },
        [scrollableHeaderHeight],
    );

    return (
        <HeaderContext.Provider
            value={{
                isHeaderVisible,
                setIsHeaderVisible,
                setScrollableHeaderHeight,
                scrollableHeaderHeight,
                handleDynamicHeaderScroll,
                isScrolled,
            }}
        >
            {children}
        </HeaderContext.Provider>
    );
};

export const useHeader = () => {
    const context = useContext(HeaderContext);
    if (context === undefined) {
        throw new Error('useHeader must be used within a HeaderProvider');
    }

    return context;
};
