import type { Meta, StoryObj } from '@storybook/react-native';

import { ICON_NAMES } from '@suite-native/icons';

import { ALERT_BOX_INTENTS } from '../../FullAlertBox/types';
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
        title: 'New version available (2.8.1).',
        buttonLabel: 'Button',
        intent: 'info',
        iconName: undefined,
        buttonProps: undefined,
        isCloseButtonDisplayed: undefined,
    },
    argTypes: {
        title: {
            control: { type: 'text' },
        },
        intent: {
            control: { type: 'select' },
            options: ALERT_BOX_INTENTS,
        },
        buttonLabel: {
            control: { type: 'text' },
        },
        isCloseButtonDisplayed: { type: 'boolean' },
        iconName: {
            control: { type: 'select' },
            options: ICON_NAMES,
        },
        onButtonPress: {
            table: { disable: true },
        },
        buttonProps: {
            table: { disable: true },
        },
    },
};
