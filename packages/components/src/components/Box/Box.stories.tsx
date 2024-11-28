import { Meta, StoryObj } from '@storybook/react';
import styled from 'styled-components';

import { Box as BoxComponent, allowedBoxFrameProps } from './Box';
import { getFramePropsStory } from '../../utils/frameProps';

const Content = styled.div`
    width: 100%;
    height: 100%;
    background: salmon;
`;

const meta: Meta = {
    title: 'Box',
    component: BoxComponent,
} as Meta;
export default meta;

export const Box: StoryObj = {
    render: props => (
        <BoxComponent {...props}>
            <Content />
        </BoxComponent>
    ),
    args: {
        ...getFramePropsStory(allowedBoxFrameProps).args,
        width: '300px',
        height: '300px',
    },
    argTypes: {
        ...getFramePropsStory(allowedBoxFrameProps).argTypes,
    },
};
