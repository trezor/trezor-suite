import React from 'react';
import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { Dropdown as DropdownComponent, DropdownProps } from './Dropdown';

const Center = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    padding: 100px 0;
    gap: 20px;
`;

const ClickableAreaTestWrapper = styled.div`
    background: ${({ theme }) => theme.backgroundAlertRedSubtleOnElevation1};
    width: fit-content;
    display: flex;
`;

const ColoredBox = styled.div`
    background-color: ${({ theme }) => theme.backgroundAlertBlueSubtleOnElevation1};
`;

// This will cause inner content to be "cut" by the container
// This is the way how it may be used, if you want to swap custom component into dropdown.
const StyledDropdown = styled(DropdownComponent)`
    overflow: hidden;
`;

const meta: Meta = {
    title: 'Dropdown',
    component: DropdownComponent,
} as Meta;
export default meta;

export const Dropdown: StoryObj<DropdownProps> = {
    render: args => (
        <Center>
            <h3>Default dots as content</h3>
            <ClickableAreaTestWrapper>
                <DropdownComponent {...args} />
            </ClickableAreaTestWrapper>
            <hr />
            <h3>Custom children with overflow: hidden; on the Dropdown itself</h3>
            <ClickableAreaTestWrapper>
                <StyledDropdown {...args}>
                    <ColoredBox>
                        Everything the State says is a lie, and everything it has it has stolen.
                    </ColoredBox>
                </StyledDropdown>
            </ClickableAreaTestWrapper>
        </Center>
    ),
    args: {
        addon: {
            onClick: () => {
                console.log('navigate somewhere');
            },
            label: 'some link',
            icon: 'arrowRightLong',
        },
        alignMenu: 'right-top',
        items: [
            {
                key: '1',
                label: 'Group 1',
                options: [
                    {
                        label: 'item 1',
                        onClick: () => {
                            console.log('item 1 clicked');
                        },
                    },
                    {
                        label: 'item 2',
                        onClick: () => {
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
                        label: 'item 3 with very long name',
                        onClick: () => {
                            console.log('item 1 clicked');
                        },
                    },
                    {
                        label: 'disabled item with icon',
                        onClick: () => {
                            console.log('item 2 clicked - disabled');
                        },
                        icon: 'lightbulb',
                        isDisabled: true,
                    },
                    {
                        label: 'disabled item with iconRight',
                        onClick: () => {
                            console.log('item 3 clicked - disabled');
                        },
                        iconRight: 'caretRight',
                        isDisabled: true,
                    },
                    {
                        label: 'basic item',
                        onClick: () => {
                            console.log('item 4 clicked');
                        },
                    },
                    {
                        label: 'item with iconRight and separator',
                        onClick: () => {
                            console.log('item 5 clicked');
                        },
                        iconRight: 'caretRight',
                        separatorBefore: true,
                    },
                ],
            },
        ],
    },
    argTypes: {
        addon: { control: { disable: true } },
        items: { control: { disable: true } },
        alignMenu: {
            control: {
                type: 'select',
            },
            options: [
                'bottom-left',
                'bottom-right',
                'left-bottom',
                'left-top',
                'right-bottom',
                'right-top',
                'top-left',
                'top-right',
            ],
        },
        content: { control: { disable: true } },
        className: { control: { disable: true } },
        coords: { control: { disable: true } },
    },
};
