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
        const disabled = boolean('Disabled', false);

        return (
            <Button
                {...(disabled ? { disabled } : {})}
                {...(variant ? { variant } : {})}
                {...(size ? { size } : {})}
                {...(icon ? { icon } : {})}
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
