import React from 'react';
import { TrezorLogo } from '../../../index';
import { storiesOf } from '@storybook/react';
import { number, select } from '@storybook/addon-knobs';

storiesOf('Logos', module).add('Trezor', () => {
    type LogoType = 'horizontal' | 'vertical';

    const width = number('width', 100);
    const height = number('height', NaN);
    const type = select(
        'type',
        {
            suite: 'suite',
            suiteCompact: 'suite_compact',
            horizontal: 'horizontal',
            vertical: 'vertical',
            symbol: 'symbol',
        },
        'horizontal'
    ) as LogoType;

    return <TrezorLogo type={type} {...(width ? { width } : {})} {...(height ? { height } : {})} />;
});
