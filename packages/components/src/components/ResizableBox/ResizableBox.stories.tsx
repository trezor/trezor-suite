import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { ResizableBoxProps, ResizableBox as BoxComponent } from './ResizableBox';

const Wrapper1 = styled.div`
    position: absolute;
    right: 0;
`;

const Content = styled.div`
    border: 1px solid black;
    width: 100%;
    height: 100%;
`;

const meta: Meta = {
    title: 'Misc/ResizableBox',
    component: props => ( // TODO finish adding multiple boxes!
        <>
            <BoxComponent {...props} />
            {/* <Wrapper1>
                <BoxComponent {...props} />
            </Wrapper1> */}
        </>
    ),
} as Meta;
export default meta;

// TODO make sure it works also for dark mode!!!
// TODO make sure it's possible to use multiple instances on the same page and independently!!!
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
