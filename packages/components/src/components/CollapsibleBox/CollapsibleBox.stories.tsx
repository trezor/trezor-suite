import { Meta, StoryObj } from '@storybook/react';

import {
    CollapsibleBox as CollapsibleBoxComponent,
    allowedCollapsibleBoxFrameProps,
} from './CollapsibleBox';
import { paddingTypes, fillTypes, headingSizes } from './types';
import { getFramePropsStory } from '../../utils/frameProps';

const meta: Meta = {
    title: 'CollapsibleBox',
    component: CollapsibleBoxComponent,
} as Meta;
export default meta;

export const CollapsibleBox: StoryObj = {
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
        ...getFramePropsStory(allowedCollapsibleBoxFrameProps).args,
    },
    argTypes: {
        heading: {
            type: 'string',
        },
        isOpen: { type: 'boolean' },
        hasDivider: { type: 'boolean' },
        fillType: {
            control: {
                type: 'select',
            },
            options: fillTypes,
        },
        paddingType: {
            control: {
                type: 'select',
            },
            options: paddingTypes,
        },
        headingSize: {
            control: {
                type: 'select',
            },
            options: headingSizes,
        },
        subHeading: {
            type: 'string',
        },
        toggleLabel: {
            type: 'string',
        },
        toggleComponent: { control: { disable: true } },
        children: { control: { disable: true } },
        ...getFramePropsStory(allowedCollapsibleBoxFrameProps).argTypes,
    },
};
