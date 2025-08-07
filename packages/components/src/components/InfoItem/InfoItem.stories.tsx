import React from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { spacings } from '@trezor/theme';

import {
    InfoItem as InfoItemComponent,
    allowedInfoItemFrameProps,
    allowedInfoItemTextProps,
} from './InfoItem';
import { infoItemVariants, infoItemVerticalAlignments } from './types';
import { getFramePropsStory } from '../../utils/frameProps';
import { flexDirection } from '../Flex/Flex';
import { iconNames } from '../Icon/constants';
import { getTextPropsStory } from '../typography/utils';

const meta: Meta = {
    title: 'InfoItem',
} as Meta;
export default meta;

export const InfoItem: StoryObj<typeof InfoItemComponent> = {
    render: props => <InfoItemComponent {...props}>Lorem ipsum</InfoItemComponent>,
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
        icon: {
            options: ['none', ...iconNames],
            mapping: {
                ...iconNames,
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
        gap: {
            options: Object.values(spacings),
            control: {
                type: 'select',
                labels: Object.fromEntries(
                    Object.entries(spacings).map(([key, value]) => [value, `${key}: ${value}`]),
                ),
            },
        },
        ...getTextPropsStory(allowedInfoItemTextProps).argTypes,
        ...getFramePropsStory(allowedInfoItemFrameProps).argTypes,
    },
};
