import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { ResizableBoxProps, ResizableBox as ResizableBoxComponent } from './ResizableBox';

const Container = styled.div`
    position: relative;
    width: 100%;
    display: flex;
`;

const Content = styled.div`
    background: green;
    padding: 10px;
    font-weight: 900;
    width: 100%;
    height: 100%;
`;

const meta: Meta = {
    title: 'ResizableBox',
    component: ResizableBoxComponent,
} as Meta;
export default meta;

export const ResizableBox: StoryObj<ResizableBoxProps> = {
    render: props => (
        <Container>
            <ResizableBoxComponent {...props} />
        </Container>
    ),
    args: {
        children: <Content>Resize me from any side!</Content>,
        directions: ['top', 'left', 'right', 'bottom'],
        isLocked: false,
        width: 100,
        minWidth: 50,
        maxWidth: 300,
        height: 100,
        minHeight: 50,
        maxHeight: 300,
        updateWidthOnWindowResize: false,
        updateHeightOnWindowResize: false,
    },
    argTypes: {
        children: {
            table: {
                type: {
                    summary: 'ReactNode',
                },
            },
        },
        directions: {
            control: {
                type: 'check',
            },
            options: ['top', 'left', 'right', 'bottom'],
        },
        isLocked: { control: 'boolean' },
        width: { control: 'number' },
        minWidth: { control: 'number' },
        maxWidth: { control: 'number' },
        height: { control: 'number' },
        minHeight: { control: 'number' },
        maxHeight: { control: 'number' },
        updateWidthOnWindowResize: {
            control: 'boolean',
            description:
                'Maximize the box width to the window width when resizing window or zooming',
            defaultValue: false,
        },
        updateHeightOnWindowResize: {
            control: 'boolean',
            description:
                'Maximize the box height to the window height when resizing window or zooming',
            defaultValue: false,
        },
    },
};
