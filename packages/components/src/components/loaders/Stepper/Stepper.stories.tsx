import { type Meta, type StoryObj } from '@storybook/react';

import { Stepper as StepperComponent, type StepperProps } from './Stepper';

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
