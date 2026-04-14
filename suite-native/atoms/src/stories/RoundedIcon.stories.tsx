import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_SIZES, icons } from '@suite-native/icons';
import { COLOR_TOKENS } from '@trezor/theme';

import { RoundedIcon as RoundedIconComponent, type RoundedIconProps } from '../RoundedIcon';

type RoundedIconStory = StoryObj<RoundedIconProps>;

const meta: Meta<RoundedIconProps> = {
    title: 'Atoms',
    component: RoundedIconComponent,
};

export default meta;

export const RoundedIcon: RoundedIconStory = {
    name: 'RoundedIcon',
    args: {
        name: 'flag',
        color: 'contentBrand',
        iconSize: 'mediumLarge',
        backgroundColor: 'legacyBackgroundTertiaryDefaultOnElevation1',
        containerSize: 48,
    },
    argTypes: {
        name: {
            control: { type: 'select' },
            options: Object.keys(icons),
        },
        iconSize: {
            control: { type: 'select' },
            options: Object.values(ICON_SIZES),
        },

        color: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },

        backgroundColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        symbol: {
            control: false,
        },
    },
};
