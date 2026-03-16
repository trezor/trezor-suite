import React from 'react';

import { type Meta, type StoryObj } from '@storybook/react';

import { spacings } from '@trezor/theme';

import {
    InfoItem as InfoItemComponent,
    allowedInfoItemFrameProps,
    allowedInfoItemTextProps,
} from './InfoItem';
import { infoItemVerticalAlignments } from './types';
import { variables } from '../../config';
import { getFramePropsStory } from '../../utils/frameProps';
import { flexDirection } from '../Flex/FlexProp';
import { textIntents, textPriorities } from '../typography/Text/Text';
import { getTextPropsStory } from '../typography/utils';

const meta: Meta<typeof InfoItemComponent> = {
    title: 'InfoItem',
};
export default meta;

export const InfoItem: StoryObj<typeof InfoItemComponent> = {
    render: props => <InfoItemComponent {...props}>Lorem ipsum</InfoItemComponent>,
    args: {
        ...getTextPropsStory(allowedInfoItemTextProps).args,
        ...getFramePropsStory(allowedInfoItemFrameProps).args,
        direction: 'column',
        label: 'Label',
        intent: 'neutral',
        priority: 'secondary',
        typographyStyle: 'body-sm',
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
        intent: {
            options: textIntents,
            control: {
                type: 'select',
            },
        },
        priority: {
            options: textPriorities,
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
