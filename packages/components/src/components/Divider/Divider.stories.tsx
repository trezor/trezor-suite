import { Meta, StoryObj } from '@storybook/react';
import { Divider as DividerComponent, allowedFrameProps } from './Divider';
import styled from 'styled-components';
import { getFramePropsStory } from '../common/frameProps';

const Container = styled.div`
    width: 200px;
    height: 200px;
`;

const meta: Meta = {
    title: 'Misc/Divider',
    component: DividerComponent,
} as Meta;
export default meta;

export const Divider: StoryObj = {
    render: props => (
        <Container>
            <DividerComponent {...props} />
        </Container>
    ),
    args: {
        orientation: 'horizontal',
        ...getFramePropsStory(allowedFrameProps).args,
    },
    argTypes: {
        orientation: {
            control: {
                type: 'select',
            },
            options: ['horizontal', 'vertical'],
        },
        strokeWidth: {
            type: 'number',
        },
        color: {
            type: 'string',
        },
        ...getFramePropsStory(allowedFrameProps).argTypes,
    },
};
