import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';
import { nativeTypographyStyles } from '@trezor/theme';

import { PICTOGRAM_VARIANTS } from '../../Pictogram/Pictogram';
import {
    PictogramTitleHeader as PictogramTitleHeaderComponent,
    type PictogramTitleHeaderProps,
} from '../../TitleHeader/PictogramTitleHeader';

type PictogramTitleHeaderStory = StoryObj<PictogramTitleHeaderProps>;

const meta: Meta<PictogramTitleHeaderProps> = {
    title: 'Atoms/TitleHeaders',
    component: PictogramTitleHeaderComponent,
};

export default meta;

export const PictogramTitleHeader: PictogramTitleHeaderStory = {
    name: 'PictogramTitleHeader',
    args: {
        variant: 'success',
        icon: undefined,
        title: 'Title message',
        subtitle: 'Something longer to say that has secondary informative value.',
        titleVariant: 'headline-sm',
    },
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: PICTOGRAM_VARIANTS,
        },
        icon: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
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
    },
};
