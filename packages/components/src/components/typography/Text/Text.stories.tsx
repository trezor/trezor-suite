import { type Meta, type StoryObj } from '@storybook/react';

import {
    Text as TextComponent,
    type TextProps,
    allowedTextFrameProps,
    allowedTextTextProps,
} from './Text';
import { getFramePropsStory } from '../../../utils/frameProps';
import { getTextPropsStory } from '../utils';

const meta: Meta<typeof TextComponent> = {
    title: '🅰️ Typography',
    component: TextComponent,
};
export default meta;

export const Text: StoryObj<TextProps> = {
    args: {
        children: 'Quos delectus veritatis est doloribus dolor.',
        isHighlighted: false,
        isMonospaced: false,
        ...getTextPropsStory(allowedTextTextProps).args,
        ...getFramePropsStory(allowedTextFrameProps).args,
    },
    argTypes: {
        isHighlighted: { control: 'boolean' },
        isMonospaced: { control: 'boolean' },
        ...getTextPropsStory(allowedTextTextProps).argTypes,
        ...getFramePropsStory(allowedTextFrameProps).argTypes,
    },
};
