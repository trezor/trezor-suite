import { Meta, StoryObj } from '@storybook/react';
import { Warning as WarningComponent, WarningProps, variables, Row } from '../../index';
import { allowedWarningFrameProps } from './Warning';
import styled from 'styled-components';
import { getFramePropsStory } from '../../utils/frameProps';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 20px;
`;

const meta: Meta = {
    title: 'Warning',
    component: WarningComponent,
    render: ({ children, ...rest }) => (
        <Wrapper>
            <WarningComponent {...rest} variant="primary">
                {children}
            </WarningComponent>
            <WarningComponent {...rest} variant="secondary">
                {children}
            </WarningComponent>
            <WarningComponent {...rest} variant="tertiary">
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
export default meta;

export const Warning: StoryObj<WarningProps> = {
    args: {
        children: 'Insert text here.',
        filled: true,
        variant: 'warning',
        icon: undefined,
        rightContent: <WarningComponent.Button>Click</WarningComponent.Button>,
        ...getFramePropsStory(allowedWarningFrameProps).args,
    },
    argTypes: {
        className: {
            control: false,
        },
        icon: {
            options: [undefined, true, ...variables.ICONS],
            control: {
                type: 'select',
            },
        },
        rightContent: {
            options: ['nothing', 'button', 'buttons', 'iconButton', 'iconButtons'],
            mapping: {
                nothing: undefined,
                button: <WarningComponent.Button>Button</WarningComponent.Button>,
                buttons: (
                    <Row gap={8}>
                        <WarningComponent.Button>Button 1</WarningComponent.Button>
                        <WarningComponent.Button isSubtle>Button 2</WarningComponent.Button>
                    </Row>
                ),
                iconButton: <WarningComponent.IconButton icon="close" />,
                iconButtons: (
                    <Row gap={8}>
                        <WarningComponent.IconButton icon="close" />
                        <WarningComponent.IconButton icon="asterisk" isSubtle />
                    </Row>
                ),
            },
            control: {
                type: 'select',
                labels: {
                    nothing: 'undefined',
                    button: '1 button',
                    buttons: '2 buttons',
                    iconButton: '1 icon button',
                    iconButtons: '2 icon buttons',
                },
            },
        },
        ...getFramePropsStory(allowedWarningFrameProps).argTypes,
    },
};
