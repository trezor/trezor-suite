import { type ArgTypes, type Meta, type StoryObj } from '@storybook/react';

import {
    Spinner as SpinnerComponent,
    type SpinnerProps,
    allowedSpinnerFrameProps,
} from './Spinner';
import { spinnerSizes, spinnerVariants } from './types';
import { getFramePropsStory } from '../../../utils/frameProps';

const meta: Meta<typeof SpinnerComponent> = {
    title: 'Spinner',
    component: SpinnerComponent,
};
export default meta;

const args: Partial<SpinnerProps> | undefined = {
    size: 40,
    variant: 'loading',
    ...getFramePropsStory(allowedSpinnerFrameProps).args,
};
const argTypes: Partial<ArgTypes<SpinnerProps>> | undefined = {
    variant: {
        control: {
            type: 'select',
        },
        options: spinnerVariants,
    },
    size: {
        control: {
            type: 'select',
        },
        options: spinnerSizes,
    },
    className: {
        control: false,
    },
    isDisabled: {
        control: {
            type: 'boolean',
        },
    },
    ...getFramePropsStory(allowedSpinnerFrameProps).argTypes,
};

export const Spinner: StoryObj<SpinnerProps> = {
    args,
    argTypes,
};
