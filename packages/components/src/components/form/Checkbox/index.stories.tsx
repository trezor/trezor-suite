import React from 'react';
import { Checkbox } from '.';
import { storiesOf } from '@storybook/react';
import { text, boolean } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/storybook';

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
        import { Checkbox } from '../../index';
        ~~~
        `,
        },
    }
);
