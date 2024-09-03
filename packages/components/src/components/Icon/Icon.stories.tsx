import { Meta, StoryObj } from '@storybook/react';
import {
    allowedIconFrameProps,
    Icon as IconComponent,
    IconProps,
    iconVariants,
    iconSizes,
} from './Icon';
import { IconName, icons } from '@suite-common/icons';
import {
    icons as iconsDeprecated,
    IconName as IconNameDeprecated,
} from '@suite-common/icons-deprecated/src/webComponents';
import { getFramePropsStory } from '../../utils/frameProps';
const meta: Meta = {
    title: 'Icons',
    component: IconComponent,
} as Meta;
export default meta;

const iconNames = new Set(Object.keys(icons) as IconName[]);
const iconsDeprecatedNames = new Set(Object.keys(iconsDeprecated) as IconNameDeprecated[]);
const allIcons = new Set(
    [...iconNames, ...iconsDeprecatedNames].sort((a, b) => a.localeCompare(b)),
);

export const Icon: StoryObj<IconProps> = {
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
        size: {
            options: iconSizes,
            control: {
                type: 'select',
            },
        },
        ...getFramePropsStory(allowedIconFrameProps).argTypes,
    },
};
