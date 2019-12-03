import React from 'react';
import { Textarea } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { text, boolean, select } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';

storiesOf('Form', module).add(
    'Textarea',
    () => {
        const value: any = text('Value', 'Input value');
        const state: any = select(
            'State',
            {
                None: null,
                Success: 'success',
                Warning: 'warning',
                Error: 'error',
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

        const topLabel: string = text('Top label', '');
        const bottomText: string = text('Bottom text', '');
        const placeholder: string = text('Placeholder', '');
        const disabled = boolean('Disabled', false);

        return (
            <Textarea
                {...(disabled ? { disabled } : {})}
                {...(state ? { state } : {})}
                {...(display ? { display } : {})}
                {...(topLabel ? { topLabel } : {})}
                {...(bottomText ? { bottomText } : {})}
                {...(placeholder ? { placeholder } : {})}
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
