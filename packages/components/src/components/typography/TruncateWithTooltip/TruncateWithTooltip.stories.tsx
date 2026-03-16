import { type Meta, type StoryObj } from '@storybook/react';
import styled from 'styled-components';

import {
    TruncateWithTooltip as TruncateWithTooltipComponent,
    type TruncateWithTooltipProps,
} from './TruncateWithTooltip';

const Container = styled.div`
    overflow: hidden;
    white-space: nowrap;
    max-width: 200px;
`;

const meta: Meta<typeof TruncateWithTooltipComponent> = {
    title: 'TruncateWithTooltip',
    component: TruncateWithTooltipComponent,
};
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
