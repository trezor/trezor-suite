import { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import {
    allowedNewModalFrameProps,
    NewModal as ModalComponent,
    NewModalProps,
    variables,
} from '../../index';
import { ThemeProvider } from 'styled-components';
import { intermediaryTheme } from '../../index';
import { getFramePropsStory } from '../../utils/frameProps';

const Buttons = () => (
    <>
        <ModalComponent.Button>Primary Action</ModalComponent.Button>
        <ModalComponent.Button variant="tertiary">Secondary Action</ModalComponent.Button>
    </>
);

const meta: Meta = {
    title: 'NewModal',
    component: ModalComponent,
    decorators: [
        Story => (
            <ThemeProvider theme={intermediaryTheme.light}>
                <ModalComponent.Provider>
                    <Story />
                    <p>
                        Quos delectus veritatis est doloribus dolor. Odit fugit omnis magni ipsam
                        quia rem aut. Et alias sint non. Consequuntur dignissimos veritatis debitis
                        corporis esse. Quaerat voluptatem unde aut. Iusto laborum omnis quis amet
                        atque. Sint culpa delectus non soluta temporibus saepe. Sequi saepe corrupti
                        aliquam ut sit assumenda aspernatur consequuntur. Ut est ullam iusto facilis
                        voluptatibus. Sit est cum quos. Quasi deleniti non fugit iste alias
                        consequuntur. Ullam ad ut culpa est reiciendis molestiae. Reiciendis ab
                        veritatis a totam inventore nihil voluptatem occaecati. Quisquam atque odit
                        quia nam. Laboriosam rem et ut. Maxime qui voluptatem voluptatem.
                    </p>
                </ModalComponent.Provider>
            </ThemeProvider>
        ),
    ],
} as Meta;
export default meta;

export const NewModal: StoryObj<NewModalProps> = {
    args: {
        variant: 'primary',
        heading: 'Modal heading',
        description: 'Modal description',
        children:
            'Quos delectus veritatis est doloribus dolor. Odit fugit omnis magni ipsam quia rem aut. Et alias sint non. Consequuntur dignissimos veritatis debitis corporis esse. Quaerat voluptatem unde aut. Iusto laborum omnis quis amet atque. Sint culpa delectus non soluta temporibus saepe. Sequi saepe corrupti aliquam ut sit assumenda aspernatur consequuntur. Ut est ullam iusto facilis voluptatibus. Sit est cum quos. Quasi deleniti non fugit iste alias consequuntur. Ullam ad ut culpa est reiciendis molestiae. Reiciendis ab veritatis a totam inventore nihil voluptatem occaecati. Quisquam atque odit quia nam. Laboriosam rem et ut. Maxime qui voluptatem voluptatem. Quos delectus veritatis est doloribus dolor. Odit fugit omnis magni ipsam quia rem aut. Et alias sint non. Consequuntur dignissimos veritatis debitis corporis esse. Quaerat voluptatem unde aut. Iusto laborum omnis quis amet atque. Sint culpa delectus non soluta temporibus saepe. Sequi saepe corrupti aliquam ut sit assumenda aspernatur consequuntur. Ut est ullam iusto facilis voluptatibus. Sit est cum quos. Quasi deleniti non fugit iste alias consequuntur. Ullam ad ut culpa est reiciendis molestiae. Reiciendis ab veritatis a totam inventore nihil voluptatem occaecati. Quisquam atque odit quia nam. Laboriosam rem et ut. Maxime qui voluptatem voluptatem. Quos delectus veritatis est doloribus dolor. Odit fugit omnis magni ipsam quia rem aut. Et alias sint non. Consequuntur dignissimos veritatis debitis corporis esse. Quaerat voluptatem unde aut. Iusto laborum omnis quis amet atque. Sint culpa delectus non soluta temporibus saepe. Sequi saepe corrupti aliquam ut sit assumenda aspernatur consequuntur. Ut est ullam iusto facilis voluptatibus. Sit est cum quos. Quasi deleniti non fugit iste alias consequuntur. Ullam ad ut culpa est reiciendis molestiae. Reiciendis ab veritatis a totam inventore nihil voluptatem occaecati. Quisquam atque odit quia nam. Laboriosam rem et ut. Maxime qui voluptatem voluptatem. Quos delectus veritatis est doloribus dolor. Odit fugit omnis magni ipsam quia rem aut. Et alias sint non. Consequuntur dignissimos veritatis debitis corporis esse. Quaerat voluptatem unde aut. Iusto laborum omnis quis amet atque. Sint culpa delectus non soluta temporibus saepe. Sequi saepe corrupti aliquam ut sit assumenda aspernatur consequuntur. Ut est ullam iusto facilis voluptatibus. Sit est cum quos. Quasi deleniti non fugit iste alias consequuntur. Ullam ad ut culpa est reiciendis molestiae. Reiciendis ab veritatis a totam inventore nihil voluptatem occaecati. Quisquam atque odit quia nam. Laboriosam rem et ut. Maxime qui voluptatem voluptatem.' +
            'Quos delectus veritatis est doloribus dolor. Odit fugit omnis magni ipsam quia rem aut. Et alias sint non. Consequuntur dignissimos veritatis debitis corporis esse. Quaerat voluptatem unde aut. Iusto laborum omnis quis amet atque. Sint culpa delectus non soluta temporibus saepe. Sequi saepe corrupti aliquam ut sit assumenda aspernatur consequuntur. Ut est ullam iusto facilis voluptatibus. Sit est cum quos. Quasi deleniti non fugit iste alias consequuntur. Ullam ad ut culpa est reiciendis molestiae. Reiciendis ab veritatis a totam inventore nihil voluptatem occaecati. Quisquam atque odit quia nam. Laboriosam rem et ut. Maxime qui voluptatem voluptatem. Quos delectus veritatis est doloribus dolor. Odit fugit omnis magni ipsam quia rem aut. Et alias sint non. Consequuntur dignissimos veritatis debitis corporis esse. Quaerat voluptatem unde aut. Iusto laborum omnis quis amet atque. Sint culpa delectus non soluta temporibus saepe. Sequi saepe corrupti aliquam ut sit assumenda aspernatur consequuntur. Ut est ullam iusto facilis voluptatibus. Sit est cum quos. Quasi deleniti non fugit iste alias consequuntur. Ullam ad ut culpa est reiciendis molestiae. Reiciendis ab veritatis a totam inventore nihil voluptatem occaecati. Quisquam atque odit quia nam. Laboriosam rem et ut. Maxime qui voluptatem voluptatem. Quos delectus veritatis est doloribus dolor. Odit fugit omnis magni ipsam quia rem aut. Et alias sint non. Consequuntur dignissimos veritatis debitis corporis esse. Quaerat voluptatem unde aut. Iusto laborum omnis quis amet atque. Sint culpa delectus non soluta temporibus saepe. Sequi saepe corrupti aliquam ut sit assumenda aspernatur consequuntur. Ut est ullam iusto facilis voluptatibus. Sit est cum quos. Quasi deleniti non fugit iste alias consequuntur. Ullam ad ut culpa est reiciendis molestiae. Reiciendis ab veritatis a totam inventore nihil voluptatem occaecati. Quisquam atque odit quia nam. Laboriosam rem et ut. Maxime qui voluptatem voluptatem. Quos delectus veritatis est doloribus dolor. Odit fugit omnis magni ipsam quia rem aut. Et alias sint non. Consequuntur dignissimos veritatis debitis corporis esse. Quaerat voluptatem unde aut. Iusto laborum omnis quis amet atque. Sint culpa delectus non soluta temporibus saepe. Sequi saepe corrupti aliquam ut sit assumenda aspernatur consequuntur. Ut est ullam iusto facilis voluptatibus. Sit est cum quos. Quasi deleniti non fugit iste alias consequuntur. Ullam ad ut culpa est reiciendis molestiae. Reiciendis ab veritatis a totam inventore nihil voluptatem occaecati. Quisquam atque odit quia nam. Laboriosam rem et ut. Maxime qui voluptatem voluptatem.',
        bottomContent: 'bottomContent' as unknown as JSX.Element,
        onCancel: 'withCallback' as unknown as () => void,
        onBackClick: 'withCallback' as unknown as () => void,
        alignment: { x: 'center', y: 'center' },
        ...getFramePropsStory(allowedNewModalFrameProps).args,
    },
    argTypes: {
        variant: {
            control: {
                type: 'radio',
            },
            options: ['primary', 'warning', 'destructive'],
        },
        size: {
            control: {
                type: 'radio',
            },
            options: ['tiny', 'small', 'medium', 'large'],
        },
        heading: {
            control: 'text',
        },
        description: {
            control: 'text',
        },
        onCancel: {
            options: ['none', 'withCallback'],
            mapping: { none: undefined, withCallback: action('onCancel') },
            control: {
                type: 'select',
                labels: {
                    none: 'none',
                    withCallback: 'with callback',
                },
            },
        },
        onBackClick: {
            options: ['none', 'withCallback'],
            mapping: { none: undefined, withCallback: action('onBackClick') },
            control: {
                type: 'select',
                labels: {
                    none: 'none',
                    withCallback: 'with callback',
                },
            },
        },
        bottomContent: {
            options: ['none', 'bottomContent'],
            mapping: {
                none: undefined,
                bottomContent: <Buttons />,
            },
            control: {
                type: 'select',
                labels: {
                    none: 'none',
                    bottomContent: 'with bottom content',
                },
            },
        },
        icon: {
            options: ['none', ...variables.ICONS],
            mapping: {
                ...variables.ICONS,
                none: undefined,
            },
            control: {
                type: 'select',
            },
        },
        alignment: {
            control: {
                type: 'select',
            },
            options: [
                'center',
                'top',
                'bottom',
                'left',
                'right',
                'top left',
                'top right',
                'bottom left',
                'bottom right',
            ],
            mapping: {
                center: { x: 'center', y: 'center' },
                top: { x: 'center', y: 'top' },
                bottom: { x: 'center', y: 'bottom' },
                left: { x: 'left', y: 'center' },
                right: { x: 'right', y: 'center' },
                'top left': { x: 'left', y: 'top' },
                'top right': { x: 'right', y: 'top' },
                'bottom left': { x: 'left', y: 'bottom' },
                'bottom right': { x: 'right', y: 'bottom' },
            },
        },
        ...getFramePropsStory(allowedNewModalFrameProps).argTypes,
    },
    parameters: {
        noWrapper: true,
    },
};
