import { StoryObj } from '@storybook/react';
import { Paragraph as P, ParagraphProps } from '../../../index';

export default {
    title: 'Typography/Paragraph',
    component: P,
};

export const Paragraph: StoryObj<ParagraphProps> = {
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
