import { Meta, StoryObj } from '@storybook/react';
import { Card as CardComponent, allowedCardFrameProps, paddingTypes } from './Card';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta = {
    title: 'Card',
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
            options: paddingTypes,
            control: {
                type: 'radio',
            },
        },
        ...getFramePropsStory(allowedCardFrameProps).argTypes,
    },
};
