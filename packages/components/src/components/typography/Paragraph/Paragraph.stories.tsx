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
        type: {
            control: 'radio',
            options: [
                'titleLarge',
                'titleMedium',
                'titleSmall',
                'highlight',
                'body',
                'callout',
                'hint',
                'label',
            ],
        },
    },
};
