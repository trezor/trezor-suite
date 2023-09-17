import { ReactNode } from 'react';
import { ImageBackground } from 'react-native';

import { Screen } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type ConnectDeviceScreenProps = {
    children: ReactNode;
};

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const ConnectDeviceScreen = ({ children }: ConnectDeviceScreenProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Screen
            customHorizontalPadding={0}
            customVerticalPadding={0}
            hasBottomInset={false}
            isScrollable={false}
        >
            <ImageBackground
                // eslint-disable-next-line global-require
                source={require('../assets/bg.png')}
                resizeMode="stretch"
                style={applyStyle(contentStyle)}
            >
                {children}
            </ImageBackground>
        </Screen>
    );
};
