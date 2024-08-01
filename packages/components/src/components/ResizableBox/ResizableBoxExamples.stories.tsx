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

const Content = styled.div<{ $color: string }>`
    background: ${({ $color }) => $color};
    padding: 10px;
    font-weight: 900;
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
            <ResizableBox
                directions={['bottom', 'right']}
                width={200}
                height={100}
                maxWidth={400}
                maxHeight={300}
            >
                <Content $color="green">Resize me from bottom and/or right</Content>
            </ResizableBox>

            <Wrapper>
                <ResizableBox
                    directions={['top', 'left']}
                    width={200}
                    height={100}
                    maxWidth={400}
                    maxHeight={300}
                >
                    <Content $color="salmon">Resize me from top and/or left</Content>
                </ResizableBox>
            </Wrapper>
        </Container>
    ),
};
