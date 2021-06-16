import React, { useState } from 'react';

import { boolean, select, text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';
import { Button, Input } from '../../..';

storiesOf('Form', module).add('Input', () => {
    const [value, setValue] = useState('Input value');

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
    const variant: any = select(
        'Variant',
        {
            'Default (large)': null,
            Small: 'small',
        },
        null
    );

    const label: string = text('Label', 'Label');
    const labelAddon = <Button variant="tertiary">Label Addon</Button>;
    const bottomText: string = text('Bottom text', '');
    const placeholder: string = text('Placeholder', '');
    const disabled = boolean('Disabled', false);
    const monospace = boolean('Monospace', false);

    return (
        <Input
            disabled={disabled}
            state={state}
            variant={variant}
            label={label}
            labelAddon={labelAddon}
            bottomText={bottomText}
            placeholder={placeholder}
            monospace={monospace}
            value={value}
            onChange={e => setValue(e.target.value)}
        />
    );
});
