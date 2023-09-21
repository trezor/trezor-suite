import { StoryObj } from '@storybook/react';
import { P, PProps } from '../../../index';

export default {
    title: 'Typography/Paragraph',
    component: P,
};

export const Paragraph: StoryObj<PProps> = {
    args: {
        children: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
    argTypes: {
        textAlign: {
            control: 'radio',
            options: ['left', 'center', 'right'],
        },
        size: {
            control: 'radio',
            options: ['normal', 'small', 'tiny'],
        },
        weight: {
            control: 'radio',
            options: ['normal', 'bold'],
        },
    },
};
