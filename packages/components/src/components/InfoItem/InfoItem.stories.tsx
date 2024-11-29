import React from 'react';

import { Meta, StoryObj } from '@storybook/react';

import {
    InfoItem as InfoItemComponent,
    allowedInfoItemFrameProps,
    allowedInfoItemTextProps,
} from './InfoItem';
import { infoItemVerticalAlignments, infoItemVariants } from './types';
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
        ...getTextPropsStory(allowedInfoItemTextProps).args,
        ...getFramePropsStory(allowedInfoItemFrameProps).args,
        direction: 'column',
        label: 'Label',
        variant: 'tertiary',
        typographyStyle: 'hint',
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
        variant: {
            options: infoItemVariants,
            control: {
                type: 'select',
            },
        },
        verticalAlignment: {
            options: infoItemVerticalAlignments,
            control: {
                type: 'radio',
            },
        },
        ...getTextPropsStory(allowedInfoItemTextProps).argTypes,
        ...getFramePropsStory(allowedInfoItemFrameProps).argTypes,
    },
};
