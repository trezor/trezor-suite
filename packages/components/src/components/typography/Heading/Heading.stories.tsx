import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';
import { H1, H2, H3, allowedHeadingFrameProps } from './Heading';
import { getFramePropsStory } from '../../../utils/frameProps';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const meta: Meta = {
    title: 'Typography/Heading',
} as Meta;
export default meta;

export const Heading: StoryObj = {
    render: () => (
        <Wrapper>
            <H1>This is heading 1</H1>
            <H2>This is heading 2</H2>
            <H3>This is heading 3</H3>
        </Wrapper>
    ),
    args: getFramePropsStory(allowedHeadingFrameProps).args,
    argTypes: getFramePropsStory(allowedHeadingFrameProps).argTypes,
};
