import { type Meta, type StoryObj } from '@storybook/react';

import {
    CollapsibleBox as CollapsibleBoxComponent,
    allowedCollapsibleBoxFrameProps,
} from './CollapsibleBox';
import { fillTypes, headingSizes, paddingTypes } from './types';
import { variables } from '../../config';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta<typeof CollapsibleBoxComponent> = {
    title: 'CollapsibleBox',
    component: CollapsibleBoxComponent,
};
export default meta;

export const CollapsibleBox: StoryObj<typeof meta> = {
    args: {
        heading: 'Heading',
        children: (
            <p>
                Lorem ipsum odor amet, consectetuer adipiscing elit. Vel hac cras ultrices nullam
                mattis proin. In rhoncus interdum molestie hac commodo bibendum torquent conubia.
                Congue facilisis sollicitudin gravida mauris suspendisse hendrerit habitasse per.
            </p>
        ),
        hasDivider: true,
        fillType: 'default',
        paddingType: 'normal',
        headingSize: 'large',
        ...getFramePropsStory(allowedCollapsibleBoxFrameProps).args,
    },
    argTypes: {
        heading: {
            type: 'string',
        },
        defaultIsOpen: { type: 'boolean' },
        hasDivider: { type: 'boolean' },
        fillType: {
            control: {
                type: 'radio',
            },
            options: fillTypes,
        },
        paddingType: {
            control: {
                type: 'radio',
            },
            options: paddingTypes,
        },
        headingSize: {
            control: {
                type: 'radio',
            },
            options: headingSizes,
        },
        subHeading: {
            type: 'string',
        },
        toggleLabel: {
            type: 'string',
        },
        toggleIconName: {
            options: ['none', ...variables.ICONS],
            mapping: {
                ...variables.ICONS,
                none: undefined,
            },
            control: {
                type: 'select',
            },
        },
        children: { control: { disable: true } },
        ...getFramePropsStory(allowedCollapsibleBoxFrameProps).argTypes,
    },
};
