import React from 'react';
import { Checkbox } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { text, boolean } from '@storybook/addon-knobs';
import { infoOptions } from '../../support/info';

storiesOf('Form', module).add(
    'Checkbox',
    () => {
        const isChecked = boolean('Checked', false);
        return (
            <Checkbox onClick={() => {}} {...(isChecked ? { isChecked } : {})}>
                {text('Label', 'Checkbox')}
            </Checkbox>
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
        ~~~js
        import { Checkbox } from '@trezor/components-v2';
        ~~~
        `,
        },
    }
);
