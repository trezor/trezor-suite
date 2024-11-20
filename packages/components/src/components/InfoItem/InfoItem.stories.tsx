import React from 'react';

import { Meta, StoryObj } from '@storybook/react';

import {
    InfoItem as InfoItemComponent,
    allowedInfoItemFrameProps,
    allowedInfoItemTextProps,
    verticalAlignments,
} from './InfoItem';
import { flexDirection } from '../Flex/Flex';
import { getFramePropsStory } from '../../utils/frameProps';
import { getTextPropsStory } from '../typography/utils';
import { variables } from '../../config';

const meta: Meta = {
    title: 'InfoItem',
} as Meta;
export default meta;

export const InfoItem: StoryObj = {
    render: props => (
        <InfoItemComponent label={undefined} {...props}>
            Lorem ipsum
        </InfoItemComponent>
    ),
    args: {
        direction: 'column',
        label: 'Label',
        ...getFramePropsStory(allowedInfoItemFrameProps).args,
        ...getTextPropsStory(allowedInfoItemTextProps).args,
    },
    argTypes: {
        direction: {
            options: flexDirection,
            control: {
                type: 'radio',
            },
        },
        label: {
            control: {
                type: 'text',
            },
        },
        iconName: {
            options: ['none', ...variables.ICONS],
            mapping: {
                ...variables.ICONS,
                none: undefined,
            },
            control: {
                type: 'select',
            },
        },
        labelWidth: {
            control: {
                type: 'number',
            },
        },
        verticalAlignment: {
            options: verticalAlignments,
            control: {
                type: 'radio',
            },
        },
        ...getFramePropsStory(allowedInfoItemFrameProps).argTypes,
        ...getTextPropsStory(allowedInfoItemTextProps).argTypes,
    },
};
