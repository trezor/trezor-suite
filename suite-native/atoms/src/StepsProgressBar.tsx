import React from 'react';

import { A } from '@mobily/ts-belt';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';

type StepsProgressBarProps = {
    numberOfSteps: number;
    activeStep: number;
};

const progressBarWrapperStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
}));

const progressBarItemStyle = prepareNativeStyle<{ isActive: boolean }>((utils, { isActive }) => ({
    width: 24,
    height: 2,
    marginRight: utils.spacings.small / 2,
    borderRadius: utils.borders.radii.small / 4,
    backgroundColor: isActive ? utils.colors.forest : utils.colors.gray300,
}));

export const StepsProgressBar = ({ numberOfSteps, activeStep }: StepsProgressBarProps) => {
    const { applyStyle } = useNativeStyles();

    const steps = A.makeWithIndex(numberOfSteps, (index: number) => index + 1);

    return (
        <Box style={applyStyle(progressBarWrapperStyle)}>
            {steps.map(stepNumber => (
                <Box
                    key={stepNumber}
                    style={applyStyle(progressBarItemStyle, { isActive: activeStep >= stepNumber })}
                />
            ))}
        </Box>
    );
};
