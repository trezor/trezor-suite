import { Meta, StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import { capitalizeFirstLetter } from '@trezor/utils';

import { Button } from '../../../index';
import { StoryColumn } from '../../../support/Story';
import { IconStories } from '../../Icon/IconStories';
import { ButtonVariant } from '../buttonStyleUtils';

const variants: Array<ButtonVariant> = ['primary', 'tertiary', 'info', 'warning', 'destructive'];

const meta: Meta<typeof Button> = {
    title: 'Buttons',
};
export default meta;

export const AllButtons: StoryFn = () => (
    <>
        {variants.map(variant => {
            const commonProps = {
                onClick: action('click'),
                variant,
            };

            return (
                <StoryColumn key={variant} minWidth={350} maxWidth={420}>
                    <Button {...commonProps}>{capitalizeFirstLetter(variant)}</Button>
                    <Button {...commonProps} size="medium">
                        {capitalizeFirstLetter(variant)} medium
                    </Button>
                    <Button {...commonProps} size="small">
                        {capitalizeFirstLetter(variant)} small
                    </Button>
                    <Button {...commonProps} icon={<IconStories name="palette" />}>
                        {capitalizeFirstLetter(variant)} icon
                    </Button>
                    <Button {...commonProps} iconAlignment="end" icon={<IconStories name="plus" />}>
                        {capitalizeFirstLetter(variant)} icon right
                    </Button>
                    <Button {...commonProps} isLoading>
                        {capitalizeFirstLetter(variant)} loading
                    </Button>
                    <Button {...commonProps} isFullWidth>
                        {capitalizeFirstLetter(variant)} full width
                    </Button>
                    <Button {...commonProps} isSubtle icon={<IconStories name="palette" />}>
                        {capitalizeFirstLetter(variant)} subtle
                    </Button>
                    <Button {...commonProps} isDisabled>
                        {capitalizeFirstLetter(variant)} disabled
                    </Button>
                </StoryColumn>
            );
        })}
    </>
);
