import { A } from '@mobily/ts-belt';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';

type StepsProgressBarProps = {
    numberOfSteps: number;
    activeStep: number;
};

const progressBarWrapperStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: utils.spacings.small,
}));

const progressBarItemStyle = prepareNativeStyle<{ isActive: boolean }>((utils, { isActive }) => ({
    width: 24,
    height: 2,
    marginRight: utils.spacings.extraSmall,
    borderRadius: utils.borders.radii.small / 4,
    backgroundColor: isActive
        ? utils.colors.backgroundPrimaryDefault
        : utils.colors.backgroundNeutralSubdued,
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
