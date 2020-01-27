import React from 'react';
import { Button } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { StoryColumn } from '../../components/Story';

const variants = ['primary', 'secondary', 'tertiary', 'danger'] as const;
const sizes = ['small', 'large'] as const;

storiesOf('Buttons', module).add(
    'All',
    () => (
        <>
            {variants.map(variant => {
                return (
                    <StoryColumn key={variant} minWidth={350}>
                        {sizes.map(size => {
                            return (
                                <Button
                                    key={size}
                                    variant={variant}
                                    size={size}
                                    data-test={`button-${variant}-${size}`}
                                >
                                    {variant[0].toUpperCase()}
                                    {variant.slice(1)} {size}
                                </Button>
                            );
                        })}
                        <Button
                            variant={variant}
                            data-test={`button-${variant}-icon`}
                            icon="PLUS"
                            onClick={() => {
                                console.log('click');
                            }}
                        >
                            {variant[0].toUpperCase()}
                            {variant.slice(1)} icon
                        </Button>
                        <Button
                            variant={variant}
                            data-test={`button-${variant}-icon-right`}
                            icon="PLUS"
                        >
                            {variant[0].toUpperCase()}
                            {variant.slice(1)} icon right
                        </Button>
                        <Button variant={variant} data-test={`button-${variant}-loading`} isLoading>
                            {variant[0].toUpperCase()}
                            {variant.slice(1)} loading
                        </Button>
                        <Button
                            variant={variant}
                            data-test={`button-${variant}-full-width`}
                            fullWidth
                        >
                            {variant[0].toUpperCase()}
                            {variant.slice(1)} full width
                        </Button>
                        <Button
                            variant={variant}
                            isDisabled
                            data-test={`button-${variant}-disabled`}
                            onClick={() => {
                                console.log('click');
                            }}
                        >
                            {variant[0].toUpperCase()}
                            {variant.slice(1)} disabled
                        </Button>
                    </StoryColumn>
                );
            })}
        </>
    ),
    {
        options: {
            showPanel: false,
        },
    }
);
