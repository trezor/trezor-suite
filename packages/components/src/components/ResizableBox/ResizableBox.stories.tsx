import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { ResizableBoxProps, ResizableBox as BoxComponent } from './ResizableBox';

const Content = styled.div`
    width: 400px;
    border: 1px solid black;
    height: 100%;
`;

const meta: Meta = {
    title: 'Misc/Box/ResizableBox',
    component: BoxComponent,
} as Meta;
export default meta;

export const ResizableBox: StoryObj<ResizableBoxProps> = {
    args: {
        children: <Content>Some content for the resizable box</Content>,
        directions: ['top', 'left', 'right', 'bottom'],
        isLocked: false,
        width: 100,
        minWidth: 100,
        maxWidth: 500,
        height: 60,
        minHeight: 60,
        maxHeight: 200,
    },
};
