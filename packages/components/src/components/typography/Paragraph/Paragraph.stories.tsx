import { Meta, StoryObj } from '@storybook/react';
import { Paragraph as P, ParagraphProps } from '../../../index';

const meta: Meta = {
    title: 'Typography/Paragraph',
    component: P,
} as Meta;
export default meta;

export const Paragraph: StoryObj<ParagraphProps> = {
    args: {
        children: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
    argTypes: {
        typographyStyle: {
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
