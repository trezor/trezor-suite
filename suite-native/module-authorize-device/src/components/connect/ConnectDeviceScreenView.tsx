import { ReactNode } from 'react';

import { Box } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ConnectDeviceScreenHeader } from './ConnectDeviceScreenHeader';

type ConnectDeviceScreenViewProps = {
    children: ReactNode;
    style?: NativeStyleObject;
    shouldDisplayCancelButton?: boolean;
};

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

export const ConnectDeviceScreenView = ({
    children,
    style,
    shouldDisplayCancelButton,
}: ConnectDeviceScreenViewProps) => {
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
