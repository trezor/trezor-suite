import { type ReactNode } from 'react';
import { View } from 'react-native';

import { useScrollViewRef } from './ScrollViewContext';

type ScrollToEndOnMountProps = {
    children: ReactNode;
};

export const ScrollToEndOnMount = ({ children }: ScrollToEndOnMountProps) => {
    const scrollViewRef = useScrollViewRef();

    const onLayout = () => scrollViewRef.current?.scrollToEnd({ animated: true });

    return <View onLayout={onLayout}>{children}</View>;
};
