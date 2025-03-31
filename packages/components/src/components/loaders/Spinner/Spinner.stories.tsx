import { ArgTypes, Meta, StoryObj } from '@storybook/react';

import { Spinner as SpinnerComponent, SpinnerProps, allowedSpinnerFrameProps } from './Spinner';
import { getFramePropsStory } from '../../../utils/frameProps';

const meta: Meta = {
    title: 'Spinner',
    component: SpinnerComponent,
} as Meta;
export default meta;

const args: Partial<SpinnerProps> | undefined = {
    size: 50,
    bodyColor: undefined,
    warningBackgroundColor: undefined,
    warningForegroundColor: undefined,
    isGrey: false,
    ...getFramePropsStory(allowedSpinnerFrameProps).args,
};
const argTypes: Partial<ArgTypes<SpinnerProps>> | undefined = {
    bodyColor: {
        control: { type: 'color' },
    },
    warningBackgroundColor: {
        control: { type: 'color' },
    },
    warningForegroundColor: {
        control: { type: 'color' },
    },
    className: {
        control: false,
    },
    isGrey: {
        control: {
            type: 'boolean',
        },
    },
    ...getFramePropsStory(allowedSpinnerFrameProps).argTypes,
};

export const Default: StoryObj<SpinnerProps> = {
    args,
    argTypes,
};

export const Success: StoryObj<SpinnerProps> = {
    args: {
        ...args,
        hasFinished: true,
        hasStartAnimation: true,
    },
    argTypes,
};

export const Error: StoryObj<SpinnerProps> = {
    args: {
        ...args,
        hasError: true,
        hasStartAnimation: true,
    },
    argTypes,
};
