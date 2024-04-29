import { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { HStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type DeviceActionProps = {
    testID: string;
    onPress: () => void;
    children: ReactNode;
    flex?: number;
    showAsFullWidth?: boolean;
};

const contentStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,
    paddingVertical: 12,
    alignItems: 'center',
    height: 44,
    gap: utils.spacings.small,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderWidth: utils.borders.widths.small,
    borderRadius: 12,
    borderColor: utils.colors.borderElevation1,
}));

const pressableStyle = prepareNativeStyle<{ showAsFullWidth: boolean; flex: number | undefined }>(
    (_, { showAsFullWidth, flex }) => {
        return {
            flex,
            extend: {
                condition: showAsFullWidth,
                style: {
                    flex: 1,
                    justifyContent: 'center',
                },
            },
        };
    },
);

export const DeviceAction = ({
    testID,
    onPress,
    children,
    flex,
    showAsFullWidth = false,
}: DeviceActionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable
            onPress={onPress}
            testID={testID}
            style={applyStyle(pressableStyle, { showAsFullWidth, flex })}
        >
            <HStack style={applyStyle(contentStyle)}>{children}</HStack>
        </Pressable>
    );
};
