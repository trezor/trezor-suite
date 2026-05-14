import type { Meta, StoryObj } from '@storybook/react-native';
import { action } from 'storybook/actions';

import { COLOR_TOKENS } from '@trezor/theme';

import { Link as LinkComponent } from '../components/Link';

type LinkStory = StoryObj<typeof LinkComponent>;

const meta: Meta<typeof LinkComponent> = {
    title: 'Links',
    component: LinkComponent,
};

export default meta;

export const Link: LinkStory = {
    name: 'Link',
    args: {
        label: 'This is a link',
        href: 'https://trezor.io',
        isUnderlined: false,
        textColor: 'contentPrimary',
        textPressedColor: 'contentPrimaryPressed',
        textVariant: 'body-md',
        onPress: action('onPress'),
    },
    argTypes: {
        label: {
            control: { type: 'text' },
        },
        href: {
            table: { disable: true },
        },
        onPress: {
            table: { disable: true },
        },
        isUnderlined: {
            control: { type: 'boolean' },
        },
        textColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        textPressedColor: {
            control: { type: 'select' },
            options: COLOR_TOKENS,
        },
        textVariant: {
            control: { type: 'select' },
            options: [
                'headline-lg',
                'headline-md',
                'headline-sm',
                'body-md-strong',
                'body-md',
                'body-sm-strong',
                'body-sm',
                'body-xs',
            ],
        },
    },
};
