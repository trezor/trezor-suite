import React from 'react';
import { IconButton } from '../../../index';
import { storiesOf } from '@storybook/react';
import { StoryColumn } from '../../../support/Story';
import { ButtonVariant } from '../buttonStyleUtils';

const variants: Array<Exclude<ButtonVariant, 'danger'>> = ['primary', 'secondary', 'tertiary'];

storiesOf('Buttons/IconButton', module).add(
    'All',
    () => (
        <>
            {variants.map(variant => (
                <StoryColumn key={variant} minWidth={350} maxWidth={420}>
                    <IconButton
                        icon="PALETTE"
                        variant={variant}
                        data-test={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />
                    <IconButton
                        icon="PALETTE"
                        variant={variant}
                        size="medium"
                        data-test={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />

                    <IconButton
                        icon="PALETTE"
                        variant={variant}
                        size="small"
                        data-test={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />

                    <IconButton
                        variant={variant}
                        data-test={`button-${variant}-icon`}
                        icon="PALETTE"
                        label={<span>Label</span>}
                        onClick={() => {
                            console.log('click');
                        }}
                    />

                    <IconButton
                        icon="PALETTE"
                        variant={variant}
                        data-test={`button-${variant}-loading`}
                        isLoading
                    />

                    <IconButton
                        icon="PALETTE"
                        variant={variant}
                        isDisabled
                        data-test={`button-${variant}-disabled`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />
                    <IconButton
                        icon="PALETTE"
                        label={<span>Label</span>}
                        variant={variant}
                        isDisabled
                        data-test={`button-${variant}-disabled`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />
                </StoryColumn>
            ))}
        </>
    ),
    {
        options: {
            showPanel: false,
        },
    },
);
