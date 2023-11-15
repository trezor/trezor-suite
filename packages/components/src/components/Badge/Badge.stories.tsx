import { Meta, StoryObj } from '@storybook/react';
import { Badge as BadgeComponent, BadgeProps } from './Badge';

export default {
    title: 'Misc/Badge',
    component: BadgeComponent,
} as Meta;

export const Badge: StoryObj<BadgeProps> = {
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
