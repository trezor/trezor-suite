import { type ReactNode } from 'react';

import { Box } from '@suite-native/atoms';
import { ConnectDeviceScreenHeader } from '@suite-native/device-authorization';
import { Screen } from '@suite-native/navigation';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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
            header={
                <ConnectDeviceScreenHeader shouldDisplayCancelButton={shouldDisplayCancelButton} />
            }
            noHorizontalPadding
            noBottomPadding
            isScrollable={false}
            hasBottomInset={false}
        >
            <Box style={[applyStyle(contentStyle), style]}>{children}</Box>
        </Screen>
    );
};
