import { type Meta, type StoryObj } from '@storybook/react';

import { Card as CardComponent, allowedCardFrameProps } from './Card';
import { cardTypes, paddingTypes } from './types';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof CardComponent> = {
    title: 'Card',
    component: CardComponent,
};
export default meta;

export const Card: StoryObj<typeof meta> = {
    args: {
        paddingType: 'normal',
        type: 'raised',
        ...getFramePropsStory(allowedCardFrameProps).args,
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
                type: 'select',
            },
        },
        header: {
            control: 'text',
        },
        footer: {
            control: 'text',
        },
        type: {
            options: cardTypes,
            control: {
                type: 'select',
            },
        },
        isSelected: {
            control: 'boolean',
        },
        ...getFramePropsStory(allowedCardFrameProps).argTypes,
    },
};
