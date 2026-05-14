import { type Meta, type StoryObj } from '@storybook/react';

import { getFramePropsStory } from '../../../utils/frameProps';
import { Tooltip } from '../../Tooltip/Tooltip';
import { Button } from '../Button/Button';
import { buttonIntents, buttonPriorities, buttonSizes } from '../types';
import { ButtonGroup, type ButtonGroupProps, allowedButtonGroupFrameProps } from './ButtonGroup';

const meta: Meta<ButtonGroupProps> = {
    title: '🫵 Buttons',
    component: ButtonGroup,
};
export default meta;

export const ButtonGroups: StoryObj<typeof meta> = {
    render: args => (
        <ButtonGroup {...args}>
            <Button isLoading>Button 1</Button>
            <Tooltip content="Ahoj!" cursor="pointer">
                <Button>Button 2 with tooltip</Button>
            </Tooltip>
            <Button isDisabled>Button 3</Button>
            <Button iconLeft="faceMask">Button 4</Button>
            <Button intent="neutral">Button 5</Button>
        </ButtonGroup>
    ),
    args: {
        intent: 'brand',
        priority: 'primary',
        size: 'medium',
        isDisabled: false,
        ...getFramePropsStory(allowedButtonGroupFrameProps).args,
    },
    argTypes: {
        intent: {
            control: { type: 'select' },
            options: buttonIntents,
        },
        priority: {
            control: { type: 'select' },
            options: buttonPriorities,
        },
        size: {
            control: { type: 'select' },
            options: buttonSizes,
        },
        isDisabled: {
            type: 'boolean',
        },
        ...getFramePropsStory(allowedButtonGroupFrameProps).argTypes,
    },
};
