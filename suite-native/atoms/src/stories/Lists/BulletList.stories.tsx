import type { Meta, StoryObj } from '@storybook/react-native';

import { COLOR_TOKENS, nativeSpacings, nativeTypographyStyles } from '@trezor/theme';

import { BulletList as BulletListComponent, type BulletListProps } from '../../List/BulletList';
import { BulletListItem } from '../../List/BulletListItem';

type BulletListStory = StoryObj<BulletListProps>;

const meta: Meta<BulletListProps> = {
    title: 'Atoms/Lists',
    component: BulletListComponent,
    render: args => (
        <BulletListComponent {...args}>
            <BulletListItem>Single line of text.</BulletListItem>
            <BulletListItem>
                A bit longer text that spans multiple lines so that line wraps are visible. It is of
                course influenced by textVariant. Three lines of text should do, I guess.
            </BulletListItem>
            <BulletListItem>
                One more list item long enough to span at least two lines even for the smallest
                textVariant.
            </BulletListItem>
        </BulletListComponent>
    ),
};

export default meta;

export const BulletList: BulletListStory = {
    name: 'BulletList',
    args: {
        textVariant: 'body-md',
        textColor: 'contentPrimary',
        spacing: 0,
    },
    argTypes: {
        textVariant: {
            control: { type: 'select' },
            options: nativeTypographyStyles,
        },
        textColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        spacing: {
            control: { type: 'select' },
            options: [0, ...Object.keys(nativeSpacings)],
        },
    },
};
