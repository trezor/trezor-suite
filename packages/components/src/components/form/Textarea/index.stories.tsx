import React, { useState } from 'react';
import { Textarea } from '../../../index';
import { storiesOf } from '@storybook/react';
import { text, boolean, select, number } from '@storybook/addon-knobs';

storiesOf('Form', module).add('Textarea', () => {
    const [value, setValue] = useState('Textarea value');

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
    const bottomText: string = text('Bottom text', '');
    const placeholder: string = text('Placeholder', '');
    const disabled = boolean('Disabled', false);
    const monospace = boolean('Monospace', false);
    const rows = number('Rows', 5, {
        min: 1,
        max: 30,
        range: true,
        step: 1,
    });

    return (
        <Textarea
            disabled={disabled}
            state={state}
            bottomText={bottomText}
            placeholder={placeholder}
            monospace={monospace}
            rows={rows}
            value={value}
            onChange={e => setValue(e.target.value)}
        />
    );
});
