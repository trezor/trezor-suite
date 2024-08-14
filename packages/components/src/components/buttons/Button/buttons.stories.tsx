import { Button } from '../../../index';
import { Meta, StoryFn } from '@storybook/react';
import { capitalizeFirstLetter } from '@trezor/utils';
import { StoryColumn } from '../../../support/Story';
import { ButtonVariant } from '../buttonStyleUtils';

const variants: Array<ButtonVariant> = [
    'primary',
    'secondary',
    'tertiary',
    'info',
    'warning',
    'destructive',
];

const meta: Meta<typeof Button> = {
    title: 'Buttons',
};
export default meta;

export const AllButtons: StoryFn = () => (
    <>
        {variants.map(variant => (
            <StoryColumn key={variant} minWidth={350} maxWidth={420}>
                <Button
                    variant={variant}
                    data-testid={`button-${variant}`}
                    onClick={() => {
                        console.log('click');
                    }}
                >
                    {capitalizeFirstLetter(variant)}
                </Button>
                <Button
                    variant={variant}
                    size="medium"
                    data-testid={`button-${variant}`}
                    onClick={() => {
                        console.log('click');
                    }}
                >
                    {capitalizeFirstLetter(variant)} medium
                </Button>
                <Button
                    variant={variant}
                    size="small"
                    data-testid={`button-${variant}`}
                    onClick={() => {
                        console.log('click');
                    }}
                >
                    {capitalizeFirstLetter(variant)} small
                </Button>

                <Button
                    variant={variant}
                    data-testid={`button-${variant}-icon`}
                    icon="PALETTE"
                    onClick={() => {
                        console.log('click');
                    }}
                >
                    {capitalizeFirstLetter(variant)} icon
                </Button>
                <Button
                    variant={variant}
                    data-testid={`button-${variant}-icon-right`}
                    iconAlignment="right"
                    icon="PLUS"
                >
                    {capitalizeFirstLetter(variant)} icon right
                </Button>
                <Button variant={variant} data-testid={`button-${variant}-loading`} isLoading>
                    {capitalizeFirstLetter(variant)} loading
                </Button>
                <Button variant={variant} data-testid={`button-${variant}-full-width`} isFullWidth>
                    {capitalizeFirstLetter(variant)} full width
                </Button>
                <Button
                    variant={variant}
                    isDisabled
                    data-testid={`button-${variant}-disabled`}
                    onClick={() => {
                        console.log('click');
                    }}
                >
                    {capitalizeFirstLetter(variant)} disabled
                </Button>
            </StoryColumn>
        ))}
    </>
);
