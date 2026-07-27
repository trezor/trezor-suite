import type { Meta, StoryObj } from '@storybook/react-native';

import { nativeSpacings, nativeTypographyStyles } from '@trezor/theme';

import {
    TitleHeader as TitleHeaderComponent,
    type TitleHeaderProps,
} from '../../TitleHeader/TitleHeader';

type TitleHeaderStory = StoryObj<TitleHeaderProps>;

const meta: Meta<TitleHeaderProps> = {
    title: 'Atoms/TitleHeaders',
    component: TitleHeaderComponent,
};

export default meta;

export const TitleHeader: TitleHeaderStory = {
    name: 'TitleHeader',
    args: {
        title: 'Title message',
        subtitle: 'Something longer to say that has secondary informative value.',
        titleVariant: 'headline-sm',
        textAlign: 'left',
        titleSpacing: 'sp8',
    },
    argTypes: {
        title: {
            control: { type: 'text' },
        },
        subtitle: {
            control: { type: 'text' },
        },
        titleVariant: {
            control: { type: 'select' },
            options: nativeTypographyStyles,
        },
        textAlign: {
            control: { type: 'select' },
            options: ['left', 'center'],
        },
        titleSpacing: {
            control: { type: 'select' },
            options: Object.keys(nativeSpacings),
        },
    },
};
