import React from 'react';

import { type Meta, type StoryObj } from '@storybook/react';

import * as generatedIcons from '@trezor/icons';
import { spacingValues } from '@trezor/theme';

import {
    InfoItem as InfoItemComponent,
    allowedInfoItemFrameProps,
    allowedInfoItemTextProps,
} from './InfoItem';
import { infoItemVerticalAlignments } from './types';
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
        icon: generatedIcons.InfoIcon,
        intent: 'neutral',
        priority: 'secondary',
        typographyStyle: 'body-sm',
    },
    argTypes: {
        icon: {
            options: ['none', ...Object.keys(generatedIcons)],
            mapping: { none: undefined, ...generatedIcons },
            control: { type: 'select' },
        },
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
            options: spacingValues,
            control: {
                type: 'select',
            },
        },
        ...getTextPropsStory(allowedInfoItemTextProps).argTypes,
        ...getFramePropsStory(allowedInfoItemFrameProps).argTypes,
    },
};
