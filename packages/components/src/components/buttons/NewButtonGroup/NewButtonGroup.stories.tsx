import React from 'react';

import { Meta, StoryObj } from '@storybook/react';

import {
    NewButtonGroup,
    NewButtonGroupProps,
    allowedNewButtonGroupFrameProps,
} from './NewButtonGroup';
import { getFramePropsStory } from '../../../utils/frameProps';
import { Tooltip } from '../../Tooltip/Tooltip';
import { NewButton } from '../NewButton/NewButton';
import { newButtonIntents, newButtonPriorities, newButtonSizes } from '../NewButton/types';

const meta: Meta<NewButtonGroupProps> = {
    title: 'Buttons',
    component: NewButtonGroup,
};
export default meta;

export const NewButtonGroups: StoryObj<typeof meta> = {
    render: args => (
        <NewButtonGroup {...args}>
            <NewButton isLoading>Button 1</NewButton>
            <Tooltip content="Ahoj!" cursor="pointer" hasArrow>
                <NewButton>Button 2 with tooltip</NewButton>
            </Tooltip>
            <NewButton isDisabled>Button 3</NewButton>
            <NewButton iconLeft="faceMask">Button 4</NewButton>
            <NewButton intent="neutral">Button 5</NewButton>
        </NewButtonGroup>
    ),
    args: {
        intent: 'brand',
        priority: 'primary',
        size: 'medium',
        isDisabled: false,
        ...getFramePropsStory(allowedNewButtonGroupFrameProps).args,
    },
    argTypes: {
        intent: {
            control: { type: 'select' },
            options: newButtonIntents,
        },
        priority: {
            control: { type: 'select' },
            options: newButtonPriorities,
        },
        size: {
            control: { type: 'select' },
            options: newButtonSizes,
        },
        isDisabled: {
            type: 'boolean',
        },
        ...getFramePropsStory(allowedNewButtonGroupFrameProps).argTypes,
    },
};
