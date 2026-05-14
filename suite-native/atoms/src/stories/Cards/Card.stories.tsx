import type { Meta, StoryObj } from '@storybook/react-native';

import { COLOR_TOKENS } from '@trezor/theme';

import { Card as CardComponent, type CardProps } from '../../Card/Card';
import { type InlineAlertBoxProps } from '../../InlineAlertBox/InlineAlertBox';
import {
    INLINE_ALERT_BOX_VARIANTS,
    type InlineAlertBoxVariant,
} from '../../InlineAlertBox/presets';
import { Text } from '../../Text';

type CardStory = StoryObj<CardProps>;

const meta: Meta<CardProps> = {
    title: 'Atoms/Cards',
    component: CardComponent,
    render: args => (
        <CardComponent {...args}>
            <Text>{args.children}</Text>
        </CardComponent>
    ),
};

export default meta;

export const Card: CardStory = {
    args: {
        children:
            'This is content inside the Card. It can be some very long text or even some other components. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    argTypes: {
        children: {
            control: false,
        },
        noPadding: {
            control: { type: 'boolean' },
        },
        noShadow: {
            control: { type: 'boolean' },
        },
        borderColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        alertPosition: {
            name: 'Alert position',
            control: { type: 'select' },
            options: ['top', 'bottom'],
        },
        alertProps: {
            name: 'Alert variant',
            control: { type: 'select' },
            options: INLINE_ALERT_BOX_VARIANTS,
            mapping: INLINE_ALERT_BOX_VARIANTS.reduce(
                (acc, variant) => {
                    acc[variant] = {
                        title: `This is some very important ${variant} alert than needs to be highlighted`,
                        variant,
                    };

                    return acc;
                },
                {} as Record<InlineAlertBoxVariant, InlineAlertBoxProps>,
            ),
        },
    },
};
