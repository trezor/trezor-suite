import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';
import { Text } from './Text';
import { RoundedIcon } from './RoundedIcon';

type AlertBoxProps = {
    title: string;
    isIconVisible?: boolean;
};

const alertWrapperStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    padding: utils.spacings.medium,
    borderRadius: utils.borders.radii.medium,
    backgroundColor: utils.colors.backgroundAlertBlueSubtleOnElevation0,
}));

const textWidthStyle = prepareNativeStyle(_ => ({
    flex: 1,
}));

const titleStyle = prepareNativeStyle<{ isIconVisible: boolean }>((_, { isIconVisible }) => ({
    textAlign: isIconVisible ? 'left' : 'center',
}));

export const AlertBox = ({ title, isIconVisible = true }: AlertBoxProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(alertWrapperStyle)}>
            {isIconVisible && (
                <Box marginRight="medium">
                    <RoundedIcon
                        name="info"
                        color="iconAlertBlue"
                        iconSize="medium"
                        backgroundColor="backgroundAlertBlueSubtleOnElevation1"
                    />
                </Box>
            )}
            <Box style={applyStyle(textWidthStyle)}>
                <Text color="textAlertBlue" style={applyStyle(titleStyle, { isIconVisible })}>
                    {title}
                </Text>
            </Box>
        </Box>
    );
};
