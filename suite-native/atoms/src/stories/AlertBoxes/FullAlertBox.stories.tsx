import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import {
    FullAlertBox as FullAlertBoxComponent,
    type FullAlertBoxProps,
} from '../../FullAlertBox/FullAlertBox';
import { FULL_ALERT_BOX_VARIANTS } from '../../FullAlertBox/presets';

type FullAlertBoxStory = StoryObj<FullAlertBoxProps>;

const meta: Meta<FullAlertBoxProps> = {
    title: 'Atoms/AlertBoxes',
    component: FullAlertBoxComponent,
};

export default meta;

export const FullAlertBox: FullAlertBoxStory = {
    name: 'FullAlertBox',
    args: {
        title: 'Title',
        description:
            'Very descriptive description. Read carefully or you will miss something important.',
        primaryButtonLabel: 'Primary',
        secondaryButtonLabel: 'Secondary',
        variant: 'info',
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
        variant: {
            control: { type: 'select' },
            options: FULL_ALERT_BOX_VARIANTS,
        },
        iconName: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
    },
};
