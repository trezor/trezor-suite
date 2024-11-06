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
        children: (
            <p>
                Quos delectus veritatis est doloribus dolor. Odit fugit omnis magni ipsam quia rem
                aut. Et alias sint non. Consequuntur dignissimos veritatis debitis corporis esse.
                Quaerat voluptatem unde aut. Iusto laborum omnis quis amet atque. Sint culpa
                delectus non soluta temporibus saepe. Sequi saepe corrupti aliquam ut sit assumenda
                aspernatur consequuntur. Ut est ullam iusto facilis voluptatibus. Sit est cum quos.
                Quasi deleniti non fugit iste alias consequuntur. Ullam ad ut culpa est reiciendis
                molestiae. Reiciendis ab veritatis a totam inventore nihil voluptatem occaecati.
                Quisquam atque odit quia nam. Laboriosam rem et ut. Maxime qui voluptatem
                voluptatem.
            </p>
        ),
        label: '',
        paddingType: 'normal',
        fillType: 'default',
        isHiglighted: false,
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
        isHiglighted: {
            control: {
                type: 'boolean',
            },
        },
        ...getFramePropsStory(allowedCardFrameProps).argTypes,
    },
};
