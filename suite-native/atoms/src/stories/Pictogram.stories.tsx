import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import {
    PICTOGRAM_VARIANTS,
    Pictogram as PictogramComponent,
    type PictogramProps,
} from '../Pictogram/Pictogram';

type PictogramStory = StoryObj<PictogramProps>;

const meta: Meta<PictogramProps> = {
    title: 'Atoms',
    component: PictogramComponent,
};

export default meta;

export const Pictogram: PictogramStory = {
    name: 'Pictogram',
    args: {
        variant: 'success',
        icon: undefined,
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
    },
};
