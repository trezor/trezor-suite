import { Meta, StoryObj } from '@storybook/react';
import {
    TruncateWithTooltip as TruncateWithTooltipComponent,
    TruncateWithTooltipProps,
} from './TruncateWithTooltip';
import styled from 'styled-components';

const Container = styled.div`
    overflow: hidden;
    white-space: nowrap;
`;

const meta: Meta = {
    title: 'TruncateWithTooltip',
    component: TruncateWithTooltipComponent,
} as Meta;
export default meta;

export const TruncateWithTooltip: StoryObj<TruncateWithTooltipProps> = {
    render: ({ children, ...rest }) => (
        <Container>
            <TruncateWithTooltipComponent {...rest}>{children}</TruncateWithTooltipComponent>
        </Container>
    ),
    args: {
        children: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        cursor: 'help',
    },
    argTypes: {
        children: {
            control: 'text',
        },
    },
};
