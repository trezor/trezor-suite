import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import {
    FullAlertBox as FullAlertBoxComponent,
    type FullAlertBoxProps,
} from '../../FullAlertBox/FullAlertBox';
import { ALERT_BOX_INTENTS } from '../../FullAlertBox/types';

type FullAlertBoxStory = StoryObj<FullAlertBoxProps>;

const meta: Meta<FullAlertBoxProps> = {
    title: 'Atoms/AlertBoxes',
    component: FullAlertBoxComponent,
};

export default meta;

export const FullAlertBox: FullAlertBoxStory = {
    name: 'FullAlertBox',
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
