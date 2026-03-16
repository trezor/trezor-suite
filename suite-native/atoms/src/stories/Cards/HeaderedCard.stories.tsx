import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import { Card } from './Card.stories';
import {
    HeaderedCard as HeaderedCardComponent,
    type HeaderedCardProps,
} from '../../Card/HeaderedCard';
import { Text } from '../../Text';

type HeaderedCardStory = StoryObj<HeaderedCardProps>;

const meta: Meta<HeaderedCardProps> = {
    title: 'Atoms/Cards',
    component: HeaderedCardComponent,
    render: args => (
        <HeaderedCardComponent {...args}>
            <Text>{args.children}</Text>
        </HeaderedCardComponent>
    ),
};

export default meta;

export const HeaderedCard: HeaderedCardStory = {
    name: 'HeaderedCard',
    args: {
        buttonIcon: 'flag',
        buttonTitle: 'Button title',
        title: 'Card title',
        children: Card.args?.children,
    },
    argTypes: {
        children: {
            control: { type: 'text' },
        },
        title: {
            control: { type: 'text' },
        },
        buttonTitle: {
            control: { type: 'text' },
        },
        buttonIcon: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
    },
};
