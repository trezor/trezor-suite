import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { StoryColumn } from '../../../support/Story';
import { Button } from '../Button/Button';
import { ButtonGroup } from './ButtonGroup';
import { IconButton } from '../IconButton/IconButton';
import { Tooltip } from '../../Tooltip/Tooltip';

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

            <ButtonGroup variant="secondary" size="medium">
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
                <IconButton icon="pencil" />
                <IconButton icon="clock" />
            </ButtonGroup>

            <ButtonGroup isDisabled>
                <IconButton icon="pencil" />
                <IconButton icon="clock" />
                <IconButton icon="twoUsers" />
            </ButtonGroup>

            <ButtonGroup variant="secondary" size="medium">
                <IconButton icon="pencil" />
                <IconButton icon="clock" />
                <IconButton icon="twoUsers" />
            </ButtonGroup>

            <ButtonGroup variant="tertiary" size="small">
                <IconButton icon="pencil" />
                <IconButton icon="clock" />
                <IconButton icon="twoUsers" />
                <IconButton icon="backend" />
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
