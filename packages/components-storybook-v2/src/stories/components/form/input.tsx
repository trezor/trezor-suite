import React from 'react';
import { Input } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { text, boolean, select } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';

storiesOf('Form', module).add(
    'Input',
    () => {
        const value: any = text('Value', '');
        const variant: any = select(
            'Variant',
            {
                'Default (large)': null,
                Small: 'small',
            },
            null
        );
        const display: any = select(
            'Display',
            {
                'Default (normal)': null,
                Short: 'short',
                Block: 'block',
            },
            null
        );
        const topLabel: any = text('Top label', '');
        const bottomText: any = text('Bottom text', '');
        const placeholder: any = text('Placeholder', '');
        const disabled = boolean('Disabled', false);
        const monospace = boolean('Monospace', false);
        const hasError = boolean('Error', false);

        return (
            <Input
                {...(disabled ? { disabled } : {})}
                {...(variant ? { variant } : {})}
                {...(display ? { display } : {})}
                {...(topLabel ? { topLabel } : {})}
                {...(bottomText ? { bottomText } : {})}
                {...(placeholder ? { placeholder } : {})}
                {...(monospace ? { monospace } : {})}
                {...(hasError ? { hasError } : {})}
                value={value}
            />
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
            ~~~js
            import { Input } from 'trezor-ui-components';
            ~~~
            `,
        },
    }
);
