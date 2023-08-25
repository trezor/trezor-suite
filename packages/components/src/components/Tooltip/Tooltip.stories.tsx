import styled from 'styled-components';
import { Tooltip as TooltipComponent, TooltipProps } from '../../index';
import { StoryObj } from '@storybook/react';

const Center = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 100px 0px;
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
            options: [null, <span>Title</span>],
        },
        placement: {
            control: 'radio',
            options: ['top', 'bottom', 'left', 'right'],
        },
        cursor: {
            options: ['pointer', 'help', 'not-allowed', 'default'],
        },
        guideAnchor: {
            control: { type: 'null' },
        },
    },
};
