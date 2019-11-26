import React from 'react';
import { Button, variables } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { boolean, select, text } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';

storiesOf('Buttons', module).add(
    'Button',
    () => {
        const value = text('Value', 'Button');
        const variant: any = select(
            'Variant',
            {
                'Default (primary)': null,
                Secondary: 'secondary',
                Danger: 'danger',
            },
            null
        );
        const size: any = select(
            'Size',
            {
                'Default (medium)': null,
                Small: 'small',
                Large: 'large',
            },
            null
        );

        const iconOptions: any = {
            None: null,
        };
        variables.ICONS.forEach((icon: string) => {
            iconOptions[icon] = icon;
        });
        const icon = select('Icon', iconOptions, null);
        const inlineWidth = boolean('Inline width', true);
        const isDisabled = boolean('Disabled', false);
        const isLoading = boolean('Loading', false);

        return (
            <Button
                {...(isDisabled ? { isDisabled } : {})}
                {...(isLoading ? { isLoading } : {})}
                {...(variant ? { variant } : {})}
                {...(size ? { size } : {})}
                {...(icon ? { icon } : {})}
                {...(!inlineWidth ? { inlineWidth: false } : {})}
            >
                {value}
            </Button>
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
            ~~~js
            import { Button } from 'trezor-ui-components';
            ~~~
            `,
        },
    }
);
