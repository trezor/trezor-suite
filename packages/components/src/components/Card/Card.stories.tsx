import { Meta, StoryObj } from '@storybook/react';
import { Card as CardComponent } from './Card';

export default {
    title: 'Misc/Card',
    component: CardComponent,
} as Meta;

export const Card: StoryObj = {
    args: {
        children: 'Some content',
    },
};
