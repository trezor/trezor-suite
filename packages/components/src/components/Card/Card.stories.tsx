import { Meta, StoryObj } from '@storybook/react';
import { Card as CardComponent, allowedCardFrameProps } from './Card';
import { getFramePropsStory } from '../../utils/frameProps';

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
        ...getFramePropsStory(allowedCardFrameProps).args,
    },
    argTypes: {
        paddingType: {
            options: ['small', 'none', 'normal'],
            control: {
                type: 'radio',
            },
        },
        ...getFramePropsStory(allowedCardFrameProps).argTypes,
    },
};
