import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import {
    BannerFull as BannerFullComponent,
    type BannerFullProps,
} from '../../BannerFull/BannerFull';
import { ALERT_BOX_INTENTS } from '../../BannerFull/types';

type BannerFullStory = StoryObj<BannerFullProps>;

const meta: Meta<BannerFullProps> = {
    title: 'Atoms/Banners',
    component: BannerFullComponent,
};

export default meta;

export const BannerFull: BannerFullStory = {
    name: 'BannerFull',
    args: {
        title: 'New Trezor firmware version available.',
        description: 'Version 2.8.0.',
        primaryButtonLabel: 'Primary',
        secondaryButtonLabel: 'Secondary',
        intent: 'info',
        iconName: undefined,
    },
    argTypes: {
        title: {
            control: { type: 'text' },
        },
        description: {
            control: { type: 'text' },
        },
        primaryButtonLabel: {
            control: { type: 'text' },
        },
        secondaryButtonLabel: {
            control: { type: 'text' },
        },
        intent: {
            control: { type: 'select' },
            options: ALERT_BOX_INTENTS,
        },
        iconName: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
    },
};
