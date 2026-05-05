import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import { FULL_ALERT_BOX_VARIANTS } from '../../FullAlertBox/presets';
import {
    InlineAlertBox as InlineAlertBoxComponent,
    type InlineAlertBoxProps,
} from '../../InlineAlertBox/InlineAlertBox';

type InlineAlertBoxStory = StoryObj<InlineAlertBoxProps>;

const meta: Meta<InlineAlertBoxProps> = {
    title: 'Atoms/AlertBoxes',
    component: InlineAlertBoxComponent,
};

export default meta;

export const InlineAlertBox: InlineAlertBoxStory = {
    name: 'InlineAlertBox',
    args: {
        title: 'Something very important to communicate.',
        buttonLabel: 'Button',
        buttonIcon: undefined,
        variant: 'info',
        iconName: undefined,
        buttonProps: undefined,
    },
    argTypes: {
        title: {
            control: { type: 'text' },
        },
        buttonLabel: {
            control: { type: 'text' },
        },
        buttonIcon: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        viewLeft: {
            control: false,
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
