import { type Meta, type StoryObj } from '@storybook/react';

import {
    RadioCard as RadioCardComponent,
    type RadioCardProps,
    allowedRadioCardFrameProps,
} from './RadioCard';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof RadioCardComponent> = {
    title: 'RadioCard',
    component: RadioCardComponent,
};
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
