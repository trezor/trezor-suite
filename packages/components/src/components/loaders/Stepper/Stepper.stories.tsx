import { StoryObj } from '@storybook/react';
import { Stepper as StepperComponent } from './Stepper';

export default {
    title: 'Loaders/Stepper',
    component: StepperComponent,
};

export const Stepper: StoryObj = {
    args: {
        step: 2,
        total: 5,
    },
};
