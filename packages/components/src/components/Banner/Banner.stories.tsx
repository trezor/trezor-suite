import { type Meta, type StoryObj } from '@storybook/react';

import { allowedBannerFrameProps } from './Banner';
import { Banner as BannerComponent, variables } from '../../index';
import { getFramePropsStory } from '../../utils/frameProps';
import { Row } from '../Flex/Flex';

const meta: Meta<typeof BannerComponent> = {
    title: 'Banner',
    component: BannerComponent,
};
export default meta;

export const Banner: StoryObj<typeof meta> = {
    args: {
        title: 'Lorem ipsum',
        description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        isLoading: false,
        intent: undefined,
        icon: true,
        rightContent: 'button',
        ...getFramePropsStory(allowedBannerFrameProps).args,
    },
    argTypes: {
        title: {
            control: 'text',
        },
        description: {
            control: 'text',
        },
        icon: {
            options: [undefined, true, ...variables.ICONS],
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
                    <Row gap={10}>
                        <BannerComponent.Button>Button</BannerComponent.Button>
                        <BannerComponent.IconButton icon="x" priority="secondary" />
                    </Row>
                ),
                iconButton: <BannerComponent.IconButton icon="x" />,
                iconButtons: (
                    <Row gap={10}>
                        <BannerComponent.IconButton icon="x" />
                        <BannerComponent.IconButton icon="asterisk" priority="secondary" />
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
