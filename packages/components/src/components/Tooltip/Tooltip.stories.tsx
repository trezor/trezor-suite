import styled from 'styled-components';
import { Tooltip as TooltipComponent, TooltipProps } from '../../index';
import { StoryObj } from '@storybook/react';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0px;
`;

const Addon = styled.span`
    background: blue;
    padding: 4px 8px;
    border-radius: 4px;
    color: white;
`;

export default {
    title: 'Misc/Tooltip',
    component: TooltipComponent,
};

export const Tooltip: StoryObj<TooltipProps> = {
    render: args => (
        <Center>
            <TooltipComponent {...args}>
                <span>Text with tooltip</span>
            </TooltipComponent>
        </Center>
    ),
    args: {
        content: 'Passphrase is an optional feature',
        offset: 10,
    },
    argTypes: {
        maxWidth: {
            type: 'number',
        },
        title: {
            options: ['null', 'title'],
            mapping: { null: null, title: <span>Title</span> },
            control: {
                type: 'select',
                labels: {
                    null: 'Null',
                    title: 'Title',
                },
            },
        },
        placement: {
            control: 'radio',
            options: ['top', 'bottom', 'left', 'right'],
        },
        cursor: {
            options: ['pointer', 'help', 'not-allowed', 'default'],
        },
        addon: {
            options: ['null', 'addon'],
            mapping: { null: null, addon: <Addon>Addon</Addon> },
            control: {
                type: 'select',
                labels: {
                    null: 'Null',
                    addon: 'Addon',
                },
            },
        },
    },
};
