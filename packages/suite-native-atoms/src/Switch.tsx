import React from 'react';
import { TouchableOpacity } from 'react-native';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from './Box';

type SwitchProps = {
    isChecked: boolean;
    onChange: (value: boolean) => void;
    isDisabled?: boolean; // Functionality of disabled works but styles are not implemented yet (waiting for design)
};

type SwitchStyleProps = {
    isChecked: boolean;
};
const wrapperStyle = prepareNativeStyle<SwitchStyleProps>((utils, { isChecked }) => ({
    width: 44,
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
    backgroundColor: utils.colors.gray400,
    borderColor: utils.colors.forest,
    borderRadius: utils.borders.radii.round,
    extend: {
        condition: isChecked,
        style: {
            alignItems: 'flex-end',
            backgroundColor: utils.colors.green,
        },
    },
}));

const SWITCH_CIRCLE_SIZE = 20;

const switchCircleStyle = prepareNativeStyle(utils => ({
    width: SWITCH_CIRCLE_SIZE,
    height: SWITCH_CIRCLE_SIZE,
    backgroundColor: utils.colors.white,
    borderRadius: utils.borders.radii.round,
    margin: 2,
}));

export const Switch = ({ isChecked, onChange, isDisabled = false }: SwitchProps) => {
    const { applyStyle } = useNativeStyles();

    const handlePress = () => {
        if (isDisabled) return;
        onChange(!isChecked);
    };

    return (
        <TouchableOpacity onPress={handlePress} style={applyStyle(wrapperStyle, { isChecked })}>
            <Box style={applyStyle(switchCircleStyle)} />
        </TouchableOpacity>
    );
};
