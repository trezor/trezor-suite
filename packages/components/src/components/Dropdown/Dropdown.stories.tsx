import { Dropdown as DropdownComponent, DropdownProps } from './Dropdown';
import { StoryObj } from '@storybook/react';

export default {
    title: 'Misc/Dropdown',
    component: DropdownComponent,
};

export const Dropdown: StoryObj<DropdownProps> = {
    args: {
        masterLink: {
            callback: () => {
                console.log('navigate somewhere');
            },
            label: 'some link',
            icon: 'ARROW_RIGHT_LONG',
        },
        items: [
            {
                key: '1',
                label: 'Group 1',
                options: [
                    {
                        key: '1',
                        label: 'item 1',
                        callback: () => {
                            console.log('item 1 clicked');
                        },
                    },
                    {
                        key: '2',
                        label: 'item 2',
                        callback: () => {
                            console.log('item 2 clicked');
                        },
                    },
                ],
            },
            {
                key: '2',
                label: 'Group 2 - with rounded items',
                options: [
                    {
                        key: '1',
                        label: 'item 3 with very long name',
                        callback: () => {
                            console.log('item 1 clicked');
                        },
                        isRounded: true,
                    },
                    {
                        key: '2',
                        label: 'disabled item with icon',
                        callback: () => {
                            console.log('item 2 clicked - disabled');
                        },
                        icon: 'LIGHTBULB',
                        isRounded: true,
                        isDisabled: true,
                    },
                    {
                        key: '3',
                        label: 'disabled item with iconRight',
                        callback: () => {
                            console.log('item 3 clicked - disabled');
                        },
                        iconRight: 'ARROW_RIGHT',
                        isRounded: true,
                        isDisabled: true,
                    },
                    {
                        key: '4',
                        label: 'basic item',
                        callback: () => {
                            console.log('item 4 clicked');
                        },
                        isRounded: true,
                    },
                    {
                        key: '5',
                        label: 'item with iconRight and separator',
                        callback: () => {
                            console.log('item 5 clicked');
                        },
                        iconRight: 'ARROW_RIGHT',
                        separatorBefore: true,
                    },
                ],
            },
        ],
    },
};
