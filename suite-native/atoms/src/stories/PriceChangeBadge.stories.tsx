import { View } from 'react-native';

import type { Meta, StoryObj } from '@storybook/react-native';

import {
    PriceChangeBadge as PriceChangeBadgeComponent,
    type PriceChangeBadgeProps,
} from '../PriceChangeBadge';

type PriceChangeBadgeStory = StoryObj<PriceChangeBadgeProps>;

const meta: Meta<PriceChangeBadgeProps> = {
    title: 'Atoms',
    component: PriceChangeBadgeComponent,
    render: args => (
        <View style={{ alignSelf: 'center' }}>
            <PriceChangeBadgeComponent {...args} />
        </View>
    ),
};

export default meta;

export const PriceChangeBadge: PriceChangeBadgeStory = {
    name: 'PriceChangeBadge',
    args: {
        valuePercentageChange: 0.123,
    },
    argTypes: {
        valuePercentageChange: {
            control: { type: 'number' },
        },
    },
};
