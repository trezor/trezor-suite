import React from 'react';
import { Button } from '../../index';
import { storiesOf } from '@storybook/react';
import { StoryColumn } from '../../support/Story';

const variants = ['primary', 'secondary', 'tertiary', 'danger'] as const;

storiesOf('Buttons', module).add(
    'All',
    () => (
        <>
            {variants.map(variant => (
                <StoryColumn key={variant} minWidth={350} maxWidth={420}>
                    <Button
                        variant={variant}
                        data-test={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    >
                        {variant[0].toUpperCase()}
                        {variant.slice(1)}
                    </Button>
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
                        alignIcon="right"
                        icon="PLUS"
                    >
                        {variant[0].toUpperCase()}
                        {variant.slice(1)} icon right
                    </Button>
                    <Button variant={variant} data-test={`button-${variant}-loading`} isLoading>
                        {variant[0].toUpperCase()}
                        {variant.slice(1)} loading
                    </Button>
                    <Button variant={variant} data-test={`button-${variant}-full-width`} fullWidth>
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
                    <Button
                        variant={variant}
                        data-test={`button-${variant}`}
                        icon="PLUS"
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
    }
);
