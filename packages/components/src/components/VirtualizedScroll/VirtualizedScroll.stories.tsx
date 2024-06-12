import { Meta, StoryFn } from '@storybook/react';
import styled from 'styled-components';
import { VirtualizedScroll } from './VirtualizedScroll';

const meta: Meta = {
    title: 'Misc/VirtualizedScroll',
} as Meta;
export default meta;

const Container = styled.div`
    /* width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center; */
    display: initial;
    width: 100%;
`;

const Item = styled.div`
    border-bottom: solid 1px silver;
    width: 100%;
`;

const heights = [20, 40, 60];
const data = Array.from({ length: 1000000 }, (_, i) => ({
    id: i,
    content: <Item>content {i}</Item>,
    height: heights[Math.floor(Math.random() * heights.length)],
}));

export const All: StoryFn = () => (
    <Container>
        <VirtualizedScroll items={data} />
    </Container>
);
