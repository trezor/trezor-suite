import { Meta, StoryObj } from '@storybook/react';
import { Card as CardComponent } from './Card';
import { framePropsStory } from '../common/frameProps';

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
        ...framePropsStory.args,
    },
    argTypes: {
        paddingType: {
            options: ['small', 'none', 'normal'],
            control: {
                type: 'radio',
            },
        },
        ...framePropsStory.argTypes,
    },
};
