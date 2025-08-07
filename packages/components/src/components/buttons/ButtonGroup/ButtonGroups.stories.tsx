import React from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { ButtonGroup } from './ButtonGroup';
import { StoryColumn } from '../../../support/Story';
import { IconStories } from '../../Icon/IconStories';
import { Tooltip } from '../../Tooltip/Tooltip';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';

const meta: Meta = {
    title: 'Buttons',
    component: ButtonGroup,
} as Meta;
export default meta;

export const ButtonGroups: StoryObj = {
    render: () => (
        <StoryColumn minWidth={350} maxWidth={420}>
            <ButtonGroup>
                <Button>Button 1</Button>
                <Tooltip content="Ahoj!" cursor="pointer" hasArrow>
                    <Button>Button 2 with tooltip</Button>
                </Tooltip>
                <Button>Button 3</Button>
            </ButtonGroup>

            <ButtonGroup isDisabled>
                <Button>Button 1</Button>
                <Button>Button 2</Button>
                <Button>Button 3</Button>
            </ButtonGroup>

            <ButtonGroup variant="tertiary" size="small">
                <Button>Button 1</Button>
                <Button>Button 2</Button>
                <Button>Button 3</Button>
                <Button>Button 4</Button>
            </ButtonGroup>

            <ButtonGroup>
                <IconButton icon={<IconStories name="pencil" />} />
                <IconButton icon={<IconStories name="clock" />} />
            </ButtonGroup>

            <ButtonGroup isDisabled>
                <IconButton icon={<IconStories name="pencil" />} />
                <IconButton icon={<IconStories name="clock" />} />
                <IconButton icon={<IconStories name="users" />} />
            </ButtonGroup>

            <ButtonGroup variant="tertiary" size="medium">
                <IconButton icon={<IconStories name="pencil" />} />
                <IconButton icon={<IconStories name="clock" />} />
                <IconButton icon={<IconStories name="users" />} />
            </ButtonGroup>

            <ButtonGroup>
                <Button>Button</Button>
                <Button>
                    A very long Lorem ipsum dolor sit amet, which wraps to many lines, but the
                    buttons have consistent height
                </Button>
            </ButtonGroup>
        </StoryColumn>
    ),
};
