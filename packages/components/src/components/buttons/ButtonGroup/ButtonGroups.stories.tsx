import React from 'react';
import { storiesOf } from '@storybook/react';
import { StoryColumn } from '../../../support/Story';
import { Button } from '../Button/Button';
import { ButtonGroup } from './ButtonGroup';
import { IconButton } from '../IconButton/IconButton';

storiesOf('Buttons/ButtonGroup', module).add('All', () => (
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

        <ButtonGroup variant="secondary" buttonSize="medium">
            <Button>Button 1</Button>
            <Button>Button 2</Button>
            <Button>Button 3</Button>
        </ButtonGroup>

        <ButtonGroup variant="tertiary" buttonSize="small">
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

        <ButtonGroup variant="secondary" buttonSize="medium">
            <IconButton icon="PENCIL" />
            <IconButton icon="CLOCK" />
            <IconButton icon="TWO_USERS" />
        </ButtonGroup>

        <ButtonGroup variant="tertiary" buttonSize="small">
            <IconButton icon="PENCIL" />
            <IconButton icon="CLOCK" />
            <IconButton icon="TWO_USERS" />
            <IconButton icon="BACKEND" />
        </ButtonGroup>
    </StoryColumn>
));
