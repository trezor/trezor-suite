import type { Meta, StoryObj } from '@storybook/react-native';

import {
    INLINE_ALERT_TEXT_VARIANTS,
    InlineAlertText as InlineAlertTextComponent,
    type InlineAlertTextProps,
} from '../InlineAlertText';

type InlineAlertTextStory = StoryObj<InlineAlertTextProps>;

const meta: Meta<InlineAlertTextProps> = {
    title: 'Atoms',
    component: InlineAlertTextComponent,
};

export default meta;

export const InlineAlertText: InlineAlertTextStory = {
    name: 'InlineAlertText',
    args: {
        variant: 'info',
        children: 'Text message',
    },
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: INLINE_ALERT_TEXT_VARIANTS,
        },
        children: {
            control: { type: 'text' },
        },
    },
};
