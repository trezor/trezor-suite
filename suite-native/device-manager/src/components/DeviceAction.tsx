import { ReactNode } from 'react';
import { Pressable } from 'react-native';

import { HStack, ACCESSIBILITY_FONTSIZE_MULTIPLIER } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type DeviceActionProps = {
    testID: string;
    onPress: () => void;
    children: ReactNode;
    flex?: number;
    showAsFullWidth?: boolean;
};

const contentStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
    alignItems: 'center',
    height: 44 * ACCESSIBILITY_FONTSIZE_MULTIPLIER,
    gap: utils.spacings.sp8,
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
