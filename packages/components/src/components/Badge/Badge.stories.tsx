import { StoryObj } from '@storybook/react';
import { Badge as BadgeComponent } from './Badge';

export default {
    title: 'Misc/Badge',
    component: BadgeComponent,
};

export const Badge: StoryObj = {
    args: {
        children: 'Badge label',
    },
    argTypes: {
        onClick: {
            options: ['null', 'withClick'],
            mapping: { null: null, withClick: () => console.log('click') },
            control: {
                type: 'select',
                labels: {
                    null: 'Null',
                    withClick: 'with onClick',
                },
            },
        },
    },
};
