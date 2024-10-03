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
    paddingVertical: utils.spacings.sp8,
    paddingHorizontal: utils.spacings.sp8,
    gap: utils.spacings.sp4,
    borderRadius: utils.borders.radii.round,
    borderWidth: utils.borders.widths.small,
    alignItems: 'center',
    height: 20,
    borderColor: utils.colors.borderElevation0,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
}));

const progressBarItemStyle = prepareNativeStyle<{ isActive: boolean }>((utils, { isActive }) => ({
    width: isActive ? 8 : 4,
    height: 4,
    borderRadius: utils.borders.radii.round,
    backgroundColor: isActive
        ? utils.colors.backgroundSecondaryDefault
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
