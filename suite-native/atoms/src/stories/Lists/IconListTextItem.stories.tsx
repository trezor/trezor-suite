import type { Meta, StoryObj } from '@storybook/react-native';

import { icons } from '@suite-native/icons';

import { ICON_SQUARE_INTENTS } from '../../Icon/IconSquare';
import { IconList } from '../../List/IconList';
import {
    IconListTextItem as IconListTextItemComponent,
    type IconListTextItemProps,
} from '../../List/IconListItem';

type IconListTextItemStory = StoryObj<IconListTextItemProps>;

const meta: Meta<IconListTextItemProps> = {
    title: 'Atoms/Lists',
    component: IconListTextItemComponent,
    render: args => (
        <IconList>
            <IconListTextItemComponent {...args}>
                List item long enough to span at least two lines even for the smallest textVariant.
            </IconListTextItemComponent>
        </IconList>
    ),
};

export default meta;

export const IconListTextItem: IconListTextItemStory = {
    name: 'IconListTextItem',
    args: {
        icon: 'trezorSafe7',
        intent: 'neutral',
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
    },
};
