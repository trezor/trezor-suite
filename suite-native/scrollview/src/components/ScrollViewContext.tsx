import { type MutableRefObject, createContext, useContext } from 'react';
import { type ScrollView } from 'react-native';

export const ScrollViewContext = createContext<MutableRefObject<ScrollView | null>>({
    current: null,
});

export const useScrollView = () => useContext(ScrollViewContext).current;
