import React from 'react';
import styled from 'styled-components';
import { Dropdown as DropdownComponent, DropdownProps } from './Dropdown';
import { StoryObj } from '@storybook/react';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0px;
`;

export default {
    title: 'Misc/Dropdown',
    component: DropdownComponent,
};

export const Dropdown: StoryObj<DropdownProps> = {
    render: args => (
        <Center>
            <DropdownComponent {...args} />
        </Center>
    ),
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
                    },
                    {
                        key: '2',
                        label: 'disabled item with icon',
                        callback: () => {
                            console.log('item 2 clicked - disabled');
                        },
                        icon: 'LIGHTBULB',
                        isDisabled: true,
                    },
                    {
                        key: '3',
                        label: 'disabled item with iconRight',
                        callback: () => {
                            console.log('item 3 clicked - disabled');
                        },
                        iconRight: 'ARROW_RIGHT',
                        isDisabled: true,
                    },
                    {
                        key: '4',
                        label: 'basic item',
                        callback: () => {
                            console.log('item 4 clicked');
                        },
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
    argTypes: {
        masterLink: { control: { disable: true } },
        items: { control: { disable: true } },
        content: { control: { disable: true } },
        className: { control: { disable: true } },
        coords: { control: { disable: true } },
    },
};
