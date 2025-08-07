import React from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { IconButton } from '../../../index';
import { StoryColumn } from '../../../support/Story';
import { IconStories } from '../../Icon/IconStories';
import { ButtonVariant } from '../buttonStyleUtils';

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
                        icon={<IconStories name="palette" />}
                        variant={variant}
                        data-testid={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />
                    <IconButton
                        icon={<IconStories name="palette" />}
                        variant={variant}
                        size="medium"
                        data-testid={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    />

                    <IconButton
                        icon={<IconStories name="palette" />}
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
                        icon={<IconStories name="palette" />}
                        label={<span>Label</span>}
                        onClick={() => {
                            console.log('click');
                        }}
                    />

                    <IconButton
                        icon={<IconStories name="palette" />}
                        variant={variant}
                        data-testid={`button-${variant}-loading`}
                        isLoading
                    />

                    <IconButton
                        icon={<IconStories name="palette" />}
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
