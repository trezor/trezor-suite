import React from 'react';
import { H1, H2 } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { select, text } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/info';

storiesOf('Typography', module).add(
    'Heading',
    () => {
        const value = text('Value', 'Heading');
        const size: any = select(
            'Size',
            {
                H1: 'H1',
                H2: 'H2',
            },
            'H1'
        );
        const align: any = select(
            'Align',
            {
                Left: 'left',
                Right: 'right',
                Center: 'center',
            },
            'left'
        );

        if (size === 'H1') {
            return <H1 textAlign={align}>{value}</H1>;
        }
        return <H2 textAlign={align}>{value}</H2>;
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
