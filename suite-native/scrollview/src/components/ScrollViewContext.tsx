import { type MutableRefObject, createContext, useContext } from 'react';
import { type ScrollViewInstance } from 'react-native';

export const ScrollViewContext = createContext<MutableRefObject<ScrollViewInstance | null>>({
    current: null,
});

export const useScrollViewRef = () => useContext(ScrollViewContext);
