import { type ReactNode, createContext, useCallback, useContext, useState } from 'react';

import { type NativeScrollEvent } from 'react-native/Libraries/Components/ScrollView/ScrollView';
import { type NativeSyntheticEvent } from 'react-native/Libraries/Types/CoreEventTypes';

type HeaderContextType = {
    setScrollableHeaderHeight: (height: number) => void;
    isScrollableHeaderScrolled: boolean;
    handleDynamicHeaderScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

type HeaderProviderProps = {
    children: ReactNode;
};

export const DynamicHeaderProvider = ({ children }: HeaderProviderProps) => {
    const [isScrollableHeaderScrolled, setIsScrollableHeaderScrolled] = useState(false);
    const [scrollableHeaderHeight, setScrollableHeaderHeight] = useState(0);

    const handleDynamicHeaderScroll = useCallback(
        ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
            const isOffsetBigger = nativeEvent.contentOffset.y > scrollableHeaderHeight;
            setIsScrollableHeaderScrolled(isOffsetBigger);
        },
        [scrollableHeaderHeight],
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

export const useDynamicHeader = () => {
    const context = useContext(HeaderContext);

    if (!context) {
        throw new Error('useHeader must be used within a HeaderProvider');
    }

    return context;
};
