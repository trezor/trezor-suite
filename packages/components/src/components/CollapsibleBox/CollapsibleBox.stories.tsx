import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';

import {
    CollapsibleBox as CollapsibleBoxComponent,
    allowedCollapsibleBoxFrameProps,
} from './CollapsibleBox';
import { action } from '@storybook/addon-actions';
import { getFramePropsStory } from '../../utils/frameProps';

const Content = styled.div`
    width: 200px;
`;

const meta: Meta = {
    title: 'Misc/CollapsibleBox',
    component: CollapsibleBoxComponent,
} as Meta;
export default meta;

export const CollapsibleBox: StoryObj = {
    args: {
        heading: 'Heading',
        children: <Content>Some content</Content>,
        isOpen: undefined,
        onToggle: action('onToggle'),
        ...getFramePropsStory(allowedCollapsibleBoxFrameProps).args,
    },
    argTypes: {
        heading: {
            type: 'string',
        },
        isOpen: { type: 'boolean' },
        defaultIsOpen: { type: 'boolean' },
        isIconFlipped: { type: 'boolean' },
        fillType: {
            control: {
                type: 'select',
            },
            options: ['none', 'default'],
        },
        paddingType: {
            control: {
                type: 'select',
            },
            options: ['none', 'normal', 'large'],
        },

        subHeading: {
            type: 'string',
        },
        iconLabel: {
            type: 'string',
        },
        children: { control: { disable: true } },
        onCollapse: { control: { disable: true } },
        ...getFramePropsStory(allowedCollapsibleBoxFrameProps).argTypes,
    },
};
