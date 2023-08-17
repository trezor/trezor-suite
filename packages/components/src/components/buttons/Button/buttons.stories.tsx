import { Button } from '../../../index';
import { storiesOf } from '@storybook/react';
import { capitalizeFirstLetter } from '@trezor/utils';
import { StoryColumn } from '../../../support/Story';
import { ButtonVariant } from '../buttonStyleUtils';

const variants: Array<ButtonVariant> = ['primary', 'secondary', 'tertiary', 'destructive'];

storiesOf('Buttons/Button', module).add(
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
                        {capitalizeFirstLetter(variant)}
                    </Button>
                    <Button
                        variant={variant}
                        size="medium"
                        data-test={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    >
                        {capitalizeFirstLetter(variant)} medium
                    </Button>
                    <Button
                        variant={variant}
                        size="small"
                        data-test={`button-${variant}`}
                        onClick={() => {
                            console.log('click');
                        }}
                    >
                        {capitalizeFirstLetter(variant)} small
                    </Button>

                    <Button
                        variant={variant}
                        data-test={`button-${variant}-icon`}
                        icon="PALETTE"
                        onClick={() => {
                            console.log('click');
                        }}
                    >
                        {capitalizeFirstLetter(variant)} icon
                    </Button>
                    <Button
                        variant={variant}
                        data-test={`button-${variant}-icon-right`}
                        iconAlignment="right"
                        icon="PLUS"
                    >
                        {capitalizeFirstLetter(variant)} icon right
                    </Button>
                    <Button variant={variant} data-test={`button-${variant}-loading`} isLoading>
                        {capitalizeFirstLetter(variant)} loading
                    </Button>
                    <Button
                        variant={variant}
                        data-test={`button-${variant}-full-width`}
                        isFullWidth
                    >
                        {capitalizeFirstLetter(variant)} full width
                    </Button>
                    <Button
                        variant={variant}
                        isDisabled
                        data-test={`button-${variant}-disabled`}
                        onClick={() => {
                            console.log('click');
                        }}
                    >
                        {capitalizeFirstLetter(variant)} disabled
                    </Button>
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
