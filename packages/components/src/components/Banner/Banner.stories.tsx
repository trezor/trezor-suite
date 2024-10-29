import { Meta, StoryObj } from '@storybook/react';
import { Banner as BannerComponent, BannerProps, variables, Row } from '../../index';
import { allowedBannerFrameProps } from './Banner';
import styled from 'styled-components';
import { getFramePropsStory } from '../../utils/frameProps';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 20px;
`;

const meta: Meta = {
    title: 'Banner',
    component: BannerComponent,
    render: ({ children, ...rest }) => (
        <Wrapper>
            <BannerComponent {...rest} variant="primary">
                {children}
            </BannerComponent>
            <BannerComponent {...rest} variant="tertiary">
                {children}
            </BannerComponent>
            <BannerComponent {...rest} variant="warning">
                {children}
            </BannerComponent>
            <BannerComponent {...rest} variant="destructive">
                {children}
            </BannerComponent>
            <BannerComponent {...rest} variant="info">
                {children}
            </BannerComponent>
        </Wrapper>
    ),
} as Meta;
export default meta;

export const Banner: StoryObj<BannerProps> = {
    args: {
        children: 'Insert text here.',
        filled: true,
        variant: 'warning',
        icon: undefined,
        rightContent: <BannerComponent.Button>Click</BannerComponent.Button>,
        color: 'inherit',
        spacingX: 'lg',
        ...getFramePropsStory(allowedBannerFrameProps).args,
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
        color: {
            options: ['inherit', 'default'],
            control: {
                type: 'select',
            },
        },
        spacingX: {
            options: ['xs', 'lg'],
            control: {
                type: 'select',
            },
        },
        rightContent: {
            options: ['nothing', 'button', 'combinedButtons', 'iconButton', 'iconButtons'],
            mapping: {
                nothing: undefined,
                button: <BannerComponent.Button>Button</BannerComponent.Button>,
                combinedButtons: (
                    <Row gap={8}>
                        <BannerComponent.Button>Button 1</BannerComponent.Button>
                        <BannerComponent.IconButton icon="x" isSubtle />
                    </Row>
                ),
                iconButton: <BannerComponent.IconButton icon="close" />,
                iconButtons: (
                    <Row gap={8}>
                        <BannerComponent.IconButton icon="close" />
                        <BannerComponent.IconButton icon="asterisk" isSubtle />
                    </Row>
                ),
            },
            control: {
                type: 'select',
                labels: {
                    nothing: 'undefined',
                    button: '1 button',
                    combinedButtons: 'buttons and icon button',
                    iconButton: '1 icon button',
                    iconButtons: '2 icon buttons',
                },
            },
        },
        ...getFramePropsStory(allowedBannerFrameProps).argTypes,
    },
};
