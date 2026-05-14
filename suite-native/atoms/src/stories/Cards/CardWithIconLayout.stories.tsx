import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import { Card as CardStory } from './Card.stories';
import {
    CardWithIconLayout as CardWithIconLayoutComponent,
    type CardWithIconLayoutProps,
} from '../../Card/CardWithIconLayout';
import { Text } from '../../Text';

type CardWithIconLayoutStory = StoryObj<CardWithIconLayoutProps>;

const meta: Meta<CardWithIconLayoutProps> = {
    title: 'Atoms/Cards',
    component: CardWithIconLayoutComponent,
    render: args => (
        <CardWithIconLayoutComponent {...args}>
            <Text>{args.children}</Text>
        </CardWithIconLayoutComponent>
    ),
};

export default meta;

export const CardWithIconLayout: CardWithIconLayoutStory = {
    name: 'CardWithIconLayout',
    args: {
        children: CardStory.args?.children,
        icon: 'flag',
        title: 'Card title',
    },
    argTypes: {
        children: {
            control: false,
        },
        icon: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        title: {
            control: { type: 'text' },
        },
        alertBoxProps: CardStory.argTypes?.alertProps,
    },
};
