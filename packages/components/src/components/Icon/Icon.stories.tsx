import { type Meta, type StoryObj } from '@storybook/react';

import * as generatedIcons from '@trezor/icons';

import { Icon as IconComponent, allowedIconFrameProps, iconIntents, iconPriorities } from './Icon';
import { iconSizes } from './types';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof IconComponent> = {
    title: 'Icons',
    component: IconComponent,
};
export default meta;

export const Icon: StoryObj<typeof IconComponent> = {
    render: args =>
        args.as ? (
            <IconComponent {...args} />
        ) : (
            <IconComponent {...args} as={generatedIcons.MagnifyingGlassIcon} />
        ),
    args: {
        as: generatedIcons.MagnifyingGlassIcon,
        intent: 'brand',
        priority: 'primary',
        isDisabled: false,
        size: 24,
        color: undefined,
        ...getFramePropsStory(allowedIconFrameProps).args,
    },
    argTypes: {
        as: {
            options: Object.keys(generatedIcons),
            mapping: generatedIcons,
            control: { type: 'select' },
        },
        intent: {
            options: [undefined, ...iconIntents],
            control: {
                type: 'select',
            },
        },
        priority: {
            options: iconPriorities,
            control: {
                type: 'select',
            },
        },
        isDisabled: {
            control: {
                type: 'boolean',
            },
        },
        color: {
            control: 'color',
        },
        size: {
            options: iconSizes,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedIconFrameProps).argTypes,
    },
};
