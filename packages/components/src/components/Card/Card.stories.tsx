import { Meta, StoryObj } from '@storybook/react';
import { Card as CardComponent, allowedFrameProps } from './Card';
import { getFramePropsStory } from '../common/frameProps';

const meta: Meta = {
    title: 'Misc/Card',
    component: CardComponent,
} as Meta;
export default meta;

export const Card: StoryObj = {
    args: {
        children: 'Some content',
        label: '',
        paddingType: 'normal',
        ...getFramePropsStory(allowedFrameProps).args,
    },
    argTypes: {
        paddingType: {
            options: ['small', 'none', 'normal'],
            control: {
                type: 'radio',
            },
        },
        ...getFramePropsStory(allowedFrameProps).argTypes,
    },
};
