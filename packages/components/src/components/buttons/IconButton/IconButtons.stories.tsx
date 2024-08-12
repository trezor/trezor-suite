import React from 'react';
import { IconButton } from '../../../index';
import { StoryColumn } from '../../../support/Story';
import { ButtonVariant } from '../buttonStyleUtils';
import { Meta, StoryObj } from '@storybook/react';

const variants: Array<Exclude<ButtonVariant, 'danger'>> = ['primary', 'secondary', 'tertiary'];

const meta: Meta = {
    title: 'Buttons/IconButton',
} as Meta;
export default meta;

export const IconButtons: StoryObj = {
    render: () => (
        <>
            {variants.map(variant => (
                <StoryColumn key={variant} minWidth={350} maxWidth={420}>
                    <IconButton
                        icon="PALETTE"
                        variant={variant}
                        data-testid={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />
                    <IconButton
                        icon="PALETTE"
                        variant={variant}
                        size="medium"
                        data-testid={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />

                    <IconButton
                        icon="PALETTE"
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
                        icon="PALETTE"
                        label={<span>Label</span>}
                        onClick={() => {
                            console.log('click');
                        }}
                    />

                    <IconButton
                        icon="PALETTE"
                        variant={variant}
                        data-testid={`button-${variant}-loading`}
                        isLoading
                    />

                    <IconButton
                        icon="PALETTE"
                        variant={variant}
                        isDisabled
                        data-testid={`button-${variant}-disabled`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />
                    <IconButton
                        icon="PALETTE"
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
