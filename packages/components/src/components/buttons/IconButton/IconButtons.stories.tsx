import React from 'react';
import { IconButton } from '../../../index';
import { StoryColumn } from '../../../support/Story';
import { ButtonVariant } from '../buttonStyleUtils';
import { Meta, StoryObj } from '@storybook/react';

const variants: Array<Exclude<ButtonVariant, 'danger'>> = ['primary', 'secondary', 'tertiary'];

export default {
    title: 'Buttons/IconButton',
} as Meta;

export const IconButtons: StoryObj = {
    render: () => (
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
                        bottomLabel={<span>Bottom Label</span>}
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
};
