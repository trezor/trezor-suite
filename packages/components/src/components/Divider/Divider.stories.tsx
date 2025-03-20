import { Meta, StoryObj } from '@storybook/react';
import styled from 'styled-components';

import { colorVariants } from '@trezor/theme';

import { Divider as DividerComponent, DividerProps, allowedDividerFrameProps } from './Divider';
import { getFramePropsStory } from '../../utils/frameProps';

const Container = styled.div<Pick<DividerProps, 'orientation'>>`
    width: 200px;
    height: 200px;
    display: flex;
    flex-direction: ${({ orientation }) => (orientation === 'horizontal' ? 'column' : 'row')};
`;

const meta: Meta = {
    title: 'Divider',
    component: DividerComponent,
} as Meta;
export default meta;

export const Divider: StoryObj<typeof DividerComponent> = {
    render: props => (
        <Container orientation={props.orientation}>
            <DividerComponent {...props} />
        </Container>
    ),
    args: {
        orientation: 'horizontal',
        contentPosition: 'center',
        color: undefined,
        children: undefined,
        ...getFramePropsStory(allowedDividerFrameProps).args,
    },
    argTypes: {
        orientation: {
            control: {
                type: 'select',
            },
            options: ['horizontal', 'vertical'],
        },
        contentPosition: {
            control: {
                type: 'select',
            },
            options: ['start', 'center', 'end'],
        },
        strokeWidth: {
            type: 'number',
        },
        color: {
            control: {
                type: 'select',
            },
            options: Object.keys(colorVariants.standard),
        },
        children: {
            control: {
                type: 'text',
            },
        },
        ...getFramePropsStory(allowedDividerFrameProps).argTypes,
    },
};
