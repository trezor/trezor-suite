import { ReactNode } from 'react';
import { ImageBackground } from 'react-native';

import { Screen } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles, NativeStyleObject } from '@trezor/styles';

import { ConnectDeviceScreenHeader } from './ConnectDeviceScreenHeader';

type ConnectDeviceScreenProps = {
    children: ReactNode;
    style?: NativeStyleObject;
};

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const ConnectDeviceBackground = ({ children, style }: ConnectDeviceScreenProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Screen
            customHeader={<ConnectDeviceScreenHeader />}
            customHorizontalPadding={0}
            customVerticalPadding={0}
            hasBottomInset={false}
            isScrollable={false}
        >
            <ImageBackground
                source={require('../assets/connectDeviceScreenBackground.png')}
                resizeMode="stretch"
                style={[applyStyle(contentStyle), style]}
            >
                {children}
            </ImageBackground>
        </Screen>
    );
};
