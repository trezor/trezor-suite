import { ReactNode } from 'react';

import { Box } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles, NativeStyleObject } from '@trezor/styles';

import { ConnectDeviceScreenHeader } from './ConnectDeviceScreenHeader';

type ConnectDeviceSreenViewProps = {
    children: ReactNode;
    style?: NativeStyleObject;
    shouldDisplayCancelButton?: boolean;
};

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const ConnectDeviceSreenView = ({
    children,
    style,
    shouldDisplayCancelButton,
}: ConnectDeviceSreenViewProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Screen
            screenHeader={
                <ConnectDeviceScreenHeader shouldDisplayCancelButton={shouldDisplayCancelButton} />
            }
            customHorizontalPadding={0}
            customVerticalPadding={0}
        >
            <Box style={[applyStyle(contentStyle), style]}>{children}</Box>
        </Screen>
    );
};
