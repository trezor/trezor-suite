import styled from 'styled-components';
import { Meta, StoryObj } from '@storybook/react';

import { CollapsibleBox as CollapsibleBoxComponent } from './CollapsibleBox';

const Content = styled.div`
    width: 400px;
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
    },
    argTypes: {
        heading: {
            type: 'string',
        },
        subHeading: {
            type: 'string',
        },
        iconLabel: {
            type: 'string',
        },
        children: { control: { disable: true } },
        onCollapse: { control: { disable: true } },
    },
};
