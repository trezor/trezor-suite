import React from 'react';
import { P } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { select, text } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';

storiesOf('Typography', module).add(
    'Heading',
    () => {
        const value = text('Value', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
        const align: any = select(
            'Align',
            {
                Left: 'left',
                Right: 'right',
                Center: 'center',
            },
            'left'
        );
        const size: any = select(
            'Size',
            {
                Normal: 'normal',
                Small: 'small',
                Tiny: 'tiny'
            },
            'normal'
        );
        const weight: any = select('Weight', {
            Normal: 'normal',
            Bold: 'bold',
        }, 'normal');

        return <P textAlign={align} size={size} weight={weight}>{value}</P>
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
