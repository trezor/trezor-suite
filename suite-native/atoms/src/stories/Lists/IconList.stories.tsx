import type { Meta, StoryObj } from '@storybook/react-native';

import { nativeTypographyStyles } from '@trezor/theme';

import { ICON_SQUARE_INTENTS, ICON_SQUARE_SIZES } from '../../Icon/IconSquare';
import { IconList as IconListComponent, type IconListProps } from '../../List/IconList';
import { IconListTextItem } from '../../List/IconListItem';

type IconListStory = StoryObj<IconListProps>;

const meta: Meta<IconListProps> = {
    title: 'Atoms/Lists',
    component: IconListComponent,
    render: args => (
        <IconListComponent {...args}>
            <IconListTextItem icon="pencilSimple">Single line of text.</IconListTextItem>
            <IconListTextItem icon="article">
                A bit longer text that spans multiple lines so that line wraps are visible. It is of
                course influenced by textVariant. Three lines of text should do, I guess.
            </IconListTextItem>
            <IconListTextItem icon="checkCircle" intent="brand">
                List item with intent override long enough to span at least two lines even for the
                smallest textVariant.
            </IconListTextItem>
        </IconListComponent>
    ),
};

export default meta;

export const IconList: IconListStory = {
    name: 'IconList',
    args: {
        iconIntent: 'neutral',
        iconSize: 40,
        verticalAlign: 'center',
        textVariant: 'body-sm',
    },
    argTypes: {
        iconIntent: {
            control: { type: 'select' },
            options: Object.values(ICON_SQUARE_INTENTS),
        },
        iconSize: {
            control: { type: 'select' },
            options: Object.values(ICON_SQUARE_SIZES),
        },
        verticalAlign: {
            control: { type: 'select' },
            options: ['flex-start', 'center'],
        },
        textVariant: {
            control: { type: 'select' },
            options: nativeTypographyStyles,
        },
    },
};
