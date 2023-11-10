import React from 'react';
import { Meta } from '@storybook/react';
import { StoryColumn } from '../../../support/Story';
import { Button } from '../Button/Button';
import { ButtonGroup } from './ButtonGroup';
import { IconButton } from '../IconButton/IconButton';

export default {
    title: 'Buttons/ButtonGroup',
    component: ButtonGroup,
} as Meta;

export const ButtonGroups = () => (
    <StoryColumn minWidth={350} maxWidth={420}>
        <ButtonGroup>
            <Button>Button 1</Button>
            <Button>Button 2</Button>
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
            <IconButton icon="PENCIL" />
            <IconButton icon="CLOCK" />
        </ButtonGroup>

        <ButtonGroup isDisabled>
            <IconButton icon="PENCIL" />
            <IconButton icon="CLOCK" />
            <IconButton icon="TWO_USERS" />
        </ButtonGroup>

        <ButtonGroup variant="secondary" size="medium">
            <IconButton icon="PENCIL" />
            <IconButton icon="CLOCK" />
            <IconButton icon="TWO_USERS" />
        </ButtonGroup>

        <ButtonGroup variant="tertiary" size="small">
            <IconButton icon="PENCIL" />
            <IconButton icon="CLOCK" />
            <IconButton icon="TWO_USERS" />
            <IconButton icon="BACKEND" />
        </ButtonGroup>
    </StoryColumn>
);
