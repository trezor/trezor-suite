import { Meta, StoryObj } from '@storybook/react';
import { Spinner as SpinnerComponent, SpinnerProps, allowedSpinnerFrameProps } from './Spinner';
import { getFramePropsStory } from '../../common/frameProps';

const meta: Meta = {
    title: 'Loaders/Spinner',
    component: SpinnerComponent,
} as Meta;
export default meta;

export const Default: StoryObj<SpinnerProps> = {
    args: {
        size: 50,
        ...getFramePropsStory(allowedSpinnerFrameProps).args,
    },
    argTypes: {
        className: {
            control: false,
        },
        ...getFramePropsStory(allowedSpinnerFrameProps).argTypes,
    },
};

export const Success: StoryObj<SpinnerProps> = {
    args: {
        size: 50,
        hasFinished: true,
        hasStartAnimation: true,
        ...getFramePropsStory(allowedSpinnerFrameProps).args,
    },
    argTypes: {
        className: {
            control: false,
        },
        ...getFramePropsStory(allowedSpinnerFrameProps).argTypes,
    },
};

export const Error: StoryObj<SpinnerProps> = {
    args: {
        size: 50,
        hasError: true,
        hasStartAnimation: true,
        ...getFramePropsStory(allowedSpinnerFrameProps).args,
    },
    argTypes: {
        className: {
            control: false,
        },
        ...getFramePropsStory(allowedSpinnerFrameProps).argTypes,
    },
};
