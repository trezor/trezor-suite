import type { Meta, StoryObj } from '@storybook/react-native';

import { icons } from '@suite-native/icons';

import { ICON_SQUARE_INTENTS } from '../../Icon/IconSquare';
import { IconList } from '../../List/IconList';
import {
    IconListTitledItem as IconListTitledItemComponent,
    type IconListTitledItemProps,
} from '../../List/IconListItem';

type IconListTitledItemStory = StoryObj<IconListTitledItemProps>;

const meta: Meta<IconListTitledItemProps> = {
    title: 'Atoms/Lists',
    component: IconListTitledItemComponent,
    render: args => (
        <IconList>
            <IconListTitledItemComponent {...args}>
                List item long enough to span at least two lines even for the smallest textVariant.
            </IconListTitledItemComponent>
        </IconList>
    ),
};

export default meta;

export const IconListTitledItem: IconListTitledItemStory = {
    name: 'IconListTitledItem',
    args: {
        icon: 'trezorSafe7',
        intent: 'neutral',
        title: 'Item title',
    },
    argTypes: {
        icon: {
            control: { type: 'select' },
            options: Object.keys(icons),
        },
        intent: {
            control: { type: 'select' },
            options: Object.values(ICON_SQUARE_INTENTS),
        },
        title: {
            control: { type: 'text' },
        },
    },
};
