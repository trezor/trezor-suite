import { Meta, StoryObj } from '@storybook/react';

import { IconName, icons } from '@suite-common/icons/src/icons';
import {
    IconName as IconNameDeprecated,
    icons as iconsDeprecated,
} from '@suite-common/icons-deprecated';
import { typedObjectKeys } from '@trezor/utils';

import { Icon as IconComponent, allowedIconFrameProps, iconSizes, iconVariants } from './Icon';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta = {
    title: 'Icons',
    component: IconComponent,
} as Meta;
export default meta;

const iconNames = new Set(typedObjectKeys(icons));
const iconsDeprecatedNames = new Set(typedObjectKeys(iconsDeprecated));
const allIcons = new Set(
    [...iconNames, ...iconsDeprecatedNames].sort((a, b) => a.localeCompare(b)),
);

export const Icon: StoryObj<typeof IconComponent> = {
    args: {
        name: 'discover',
        variant: 'primary',
        size: 'large',
        color: undefined,
        ...getFramePropsStory(allowedIconFrameProps).args,
    },
    argTypes: {
        name: {
            options: [...allIcons],
            control: {
                type: 'select',
                labels: [...iconsDeprecatedNames].reduce(
                    (acc, name) => {
                        if (!iconNames.has(name as IconName)) {
                            acc[name] = `${name} (deprecated)`;
                        }

                        return acc;
                    },
                    {} as Record<IconNameDeprecated, string>,
                ),
            },
        },
        variant: {
            options: iconVariants,
            control: {
                type: 'select',
            },
        },
        color: {
            control: 'color',
        },
        size: {
            options: Object.values(iconSizes),
            control: {
                type: 'select',
                labels: Object.fromEntries(
                    Object.entries(iconSizes).map(([key, value]) => [value, `${key}: ${value}`]),
                ),
            },
        },
        ...getFramePropsStory(allowedIconFrameProps).argTypes,
    },
};
