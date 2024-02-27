import { Meta, StoryObj } from '@storybook/react';
import { Warning as WarningComponent, WarningProps, variables } from '../../index';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 20px;
`;

export default {
    title: 'Misc/Warning',
    component: WarningComponent,
    render: ({ children, ...rest }) => (
        <Wrapper>
            <WarningComponent {...rest} variant="primary">
                {children}
            </WarningComponent>
            <WarningComponent {...rest} variant="warning">
                {children}
            </WarningComponent>
            <WarningComponent {...rest} variant="destructive">
                {children}
            </WarningComponent>
            <WarningComponent {...rest} variant="info">
                {children}
            </WarningComponent>
        </Wrapper>
    ),
} as Meta;

export const Warning: StoryObj<WarningProps> = {
    args: {
        children: 'Insert text here.',
        withIcon: true,
        variant: 'warning',
        icon: undefined,
    },
    argTypes: {
        className: {
            control: false,
        },
        icon: {
            options: variables.ICONS,
            control: {
                type: 'select',
            },
        },
    },
};
