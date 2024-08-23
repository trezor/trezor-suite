import React from 'react';
import { IconButton } from '../../../index';
import { StoryColumn } from '../../../support/Story';
import { ButtonVariant } from '../buttonStyleUtils';
import { Meta, StoryObj } from '@storybook/react';

const variants: Array<Exclude<ButtonVariant, 'danger'>> = ['primary', 'tertiary'];

const meta: Meta = {
    title: 'Buttons',
} as Meta;
export default meta;

export const IconButtons: StoryObj = {
    render: () => (
        <>
            {variants.map(variant => (
                <StoryColumn key={variant} minWidth={350} maxWidth={420}>
                    <IconButton
                        icon="palette"
                        variant={variant}
                        data-testid={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />
                    <IconButton
                        icon="palette"
                        variant={variant}
                        size="medium"
                        data-testid={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />

                    <IconButton
                        icon="palette"
                        variant={variant}
                        size="small"
                        data-testid={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />

                    <IconButton
                        variant={variant}
                        data-testid={`button-${variant}-icon`}
                        icon="palette"
                        label={<span>Label</span>}
                        onClick={() => {
                            console.log('click');
                        }}
                    />

                    <IconButton
                        icon="palette"
                        variant={variant}
                        data-testid={`button-${variant}-loading`}
                        isLoading
                    />

                    <IconButton
                        icon="palette"
                        variant={variant}
                        isDisabled
                        data-testid={`button-${variant}-disabled`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />
                    <IconButton
                        icon="palette"
                        bottomLabel={<span>Bottom Label</span>}
                        variant={variant}
                        isDisabled
                        data-testid={`button-${variant}-disabled`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />
                </StoryColumn>
            ))}
        </>
    ),
};
