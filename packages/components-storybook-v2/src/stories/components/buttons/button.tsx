import React from 'react';
import { Button } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { boolean, select } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';

storiesOf('Buttons', module).add(
    'Button',
    () => {
        const disabled = boolean('Disabled', false);
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

        return (
            <Button
                {...(disabled ? { disabled } : {})}
                {...(variant ? { variant } : {})}
                {...(size ? { size } : {})}
            >
                Label
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
