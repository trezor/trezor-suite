import { Meta, StoryObj } from '@storybook/react';

import {
    RadioCard as RadioCardComponent,
    RadioCardProps,
    allowedRadioCardFrameProps,
} from './RadioCard';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta = {
    title: 'RadioCard',
    component: RadioCardComponent,
} as Meta;
export default meta;

export const RadioCard: StoryObj<RadioCardProps> = {
    args: {
        isActive: true,
        isDisabled: false,
        children: 'Content',
        ...getFramePropsStory(allowedRadioCardFrameProps).args,
    },
    argTypes: {
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        isActive: {
            control: {
                type: 'boolean',
            },
        },
        ...getFramePropsStory(allowedRadioCardFrameProps).argTypes,
    },
};
