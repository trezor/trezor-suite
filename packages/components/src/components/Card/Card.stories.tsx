import { Card as CardComponent } from './Card';
import { StoryObj } from '@storybook/react';

export default {
    title: 'Misc/Card',
    component: CardComponent,
};

export const Card: StoryObj = {
    args: {
        children: 'Some content',
    },
};
