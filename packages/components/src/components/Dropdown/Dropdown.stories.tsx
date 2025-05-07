import { Meta, StoryObj } from '@storybook/react';

import {
    Dropdown as DropdownComponent,
    DropdownProps,
    allowedDropdownFrameProps,
} from './Dropdown';
import { variables } from '../../config';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta = {
    title: 'Dropdown',
    component: DropdownComponent,
} as Meta;
export default meta;

export const Dropdown: StoryObj<DropdownProps> = {
    args: {
        placement: {
            position: 'bottom',
            alignment: 'center',
        },
        isLoading: false,
        isDisabled: false,
        items: [
            {
                label: 'item 1',
                onClick: () => {
                    console.log('item 1 clicked');
                },
                isDisabled: true,
            },
            {
                label: 'item 2',
                onClick: () => {
                    console.log('item 2 clicked');
                },
            },
            {
                label: 'item 3 with very long name',
                onClick: () => {
                    console.log('item 3 clicked');
                },
            },
            {
                label: 'disabled item with icon',
                onClick: () => {
                    console.log('item 4 clicked - disabled');
                },
                icon: 'lightbulb',
                isDisabled: true,
            },
            {
                label: 'disabled item with iconRight',
                onClick: () => {
                    console.log('item 5 clicked - disabled');
                },
                iconRight: 'caretRight',
                isDisabled: true,
            },
            {
                label: 'basic item',
                onClick: () => {
                    console.log('item 6 clicked');
                },
            },
            {
                label: 'item with iconRight',
                onClick: () => {
                    console.log('item 7 clicked');
                },
                iconRight: 'caretRight',
            },
        ],
        ...getFramePropsStory(allowedDropdownFrameProps).args,
    },
    argTypes: {
        iconName: {
            options: variables.ICONS,
            control: {
                type: 'select',
            },
        },
        placement: {
            control: {
                type: 'object',
            },
        },
        isLoading: {
            control: {
                type: 'boolean',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        ...getFramePropsStory(allowedDropdownFrameProps).argTypes,
    },
};
