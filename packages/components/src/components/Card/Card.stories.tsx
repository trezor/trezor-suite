import { Meta, StoryObj } from '@storybook/react';
import { Card as CardComponent, allowedCardFrameProps } from './Card';
import { paddingTypes, fillTypes } from './types';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta = {
    title: 'Card',
    component: CardComponent,
} as Meta;
export default meta;

export const Card: StoryObj = {
    args: {
        children: <p>Lorem ipsum</p>,
        label: '',
        paddingType: 'normal',
        fillType: 'default',
        ...getFramePropsStory(allowedCardFrameProps).args,
    },
    argTypes: {
        onClick: {
            options: ['onClick'],
            control: { type: 'select' },
            mapping: { onClick: () => {} },
        },
        paddingType: {
            options: paddingTypes,
            control: {
                type: 'radio',
            },
        },
        fillType: {
            options: fillTypes,
            control: {
                type: 'radio',
            },
        },
        ...getFramePropsStory(allowedCardFrameProps).argTypes,
    },
};
