import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { ResizableBox } from './ResizableBox';

const Container = styled.div`
    position: relative;
    width: 100%;
    height: 300px;
`;
const Wrapper = styled.div`
    bottom: 0;
    right: 0;
    position: absolute;
`;

const Content = styled.div`
    border: 1px solid green;
    width: 100%;
    height: 100%;
`;

const meta: Meta = {
    title: 'Misc/ResizableBox',
} as Meta;
export default meta;

export const ResizableBoxExamples: StoryObj = {
    render: () => (
        <Container>
            {/* top left resizable box example */}
            <ResizableBox directions={['bottom', 'right']} width={200} height={100}>
                <Content>Resize me from bottom and/or right</Content>
            </ResizableBox>

            <Wrapper>
                <ResizableBox directions={['top', 'left']} width={200} height={100}>
                    <Content>Resize me from top and/or left</Content>
                </ResizableBox>
            </Wrapper>
        </Container>
    ),
};
