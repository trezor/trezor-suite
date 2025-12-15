import type { Meta, StoryObj } from '@storybook/react';

import type { StepperProps } from './Stepper';
import { Stepper as StepperComponent } from './Stepper';

const meta: Meta<typeof StepperComponent> = {
    title: 'Stepper',
    component: StepperComponent,
};
export default meta;

export const Stepper: StoryObj<StepperProps> = {
    args: {
        step: 2,
        total: 5,
    },
};
