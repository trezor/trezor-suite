import React from 'react';
import { Link } from '../../../index';
import { storiesOf } from '@storybook/react';
import { select, text } from '@storybook/addon-knobs';
import { infoOptions } from '../../../support/storybook';

storiesOf('Typography', module).add(
    'Link',
    () => {
        const target = select(
            'Target',
            {
                None: null,
                Blank: '_blank',
                Self: '_self',
                Parent: '_parent',
                Top: '_top',
            },
            null
        );
        const href = text('URL', 'https://trezor.io');
        const linkText = text('Text', 'This is a link.');

        return (
            <Link href={href} {...(target ? { target } : {})}>
                {linkText}
            </Link>
        );
    },
    {
        info: {
            ...infoOptions,
            text: `
            ~~~js
            import { Link } from '../../index';
            ~~~
            `,
        },
    }
);
