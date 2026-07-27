import { type Meta, type StoryObj } from '@storybook/react';

import * as generatedIcons from '@trezor/icons';

import { allowedBannerFrameProps } from './Banner';
import { Banner as BannerComponent } from '../../index';
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
        isLoading: {
            control: 'boolean',
        },
        icon: {
            options: [undefined, true, ...Object.keys(generatedIcons)],
            mapping: generatedIcons,
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
                        <BannerComponent.IconButton
                            icon={generatedIcons.XIcon}
                            priority="secondary"
                            tooltip={{ content: 'Dismiss' }}
                        />
                    </Row>
                ),
                iconButton: (
                    <BannerComponent.IconButton
                        icon={generatedIcons.XIcon}
                        tooltip={{ content: 'Dismiss' }}
                    />
                ),
                iconButtons: (
                    <Row gap={10}>
                        <BannerComponent.IconButton
                            icon={generatedIcons.XIcon}
                            tooltip={{ content: 'Dismiss' }}
                        />
                        <BannerComponent.IconButton
                            icon={generatedIcons.AsteriskIcon}
                            priority="secondary"
                            tooltip={{ content: 'Details' }}
                        />
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
