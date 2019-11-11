import React from 'react';
import { Button } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { text, boolean, select } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';

storiesOf('Buttons', module).add(
    'Button',
    () => {
        const isDisabled = boolean('Disabled', false);
        const variant: any = select(
            'Variant',
            {
                'Default (primary)': null,
                Primary: 'primary',
                Secondary: 'secondary',
                Tertiary: 'tertiary',
            },
            null
        );
        const size: any = select(
            'Size',
            {
                'Default (medium)': null,
                Small: 'small',
                Medium: 'medium',
                Large: 'large',
            },
            null
        );

        return (
            <Button 
                {...(isDisabled ? { isDisabled } : {})}
                {...(variant ? { variant } : {})}
                {...(size ? { size } : {})}
            >
                Test text
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
