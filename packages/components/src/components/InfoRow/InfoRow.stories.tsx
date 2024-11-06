import React from 'react';

import { Meta, StoryObj } from '@storybook/react';

import {
    InfoRow as InfoRowComponent,
    allowedInfoRowFrameProps,
    allowedInfoRowTextProps,
} from './InfoRow';
import { flexDirection } from '../Flex/Flex';
import { getFramePropsStory } from '../../utils/frameProps';
import { getTextPropsStory } from '../typography/utils';

const meta: Meta = {
    title: 'InfoRow',
} as Meta;
export default meta;

export const InfoRow: StoryObj = {
    render: props => (
        <InfoRowComponent label={undefined} {...props}>
            Lorem ipsum
        </InfoRowComponent>
    ),
    args: {
        direction: 'column',
        label: 'Label',
        ...getFramePropsStory(allowedInfoRowFrameProps).args,
        ...getTextPropsStory(allowedInfoRowTextProps).args,
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
        ...getFramePropsStory(allowedInfoRowFrameProps).argTypes,
        ...getTextPropsStory(allowedInfoRowTextProps).argTypes,
    },
};
