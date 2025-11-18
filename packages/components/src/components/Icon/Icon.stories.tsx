import { Meta, StoryObj } from '@storybook/react';

// TODO: suite-common imports in non-suite packages should not be allowed
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { icons } from '@suite-common/icons/src/icons';

import { Icon as IconComponent, allowedIconFrameProps } from './Icon';
import { iconSizes, iconVariants } from './types';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof IconComponent> = {
    title: 'Icons',
    component: IconComponent,
};
export default meta;

export const Icon: StoryObj<typeof IconComponent> = {
    args: {
        name: 'discover',
        variant: undefined,
        size: 24,
        color: undefined,
        isDisabled: false,
        ...getFramePropsStory(allowedIconFrameProps).args,
    },
    argTypes: {
        name: {
            options: Object.keys(icons),
            control: {
                type: 'select',
            },
        },
        variant: {
            options: [undefined, ...iconVariants],
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
