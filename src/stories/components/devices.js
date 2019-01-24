import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Pin from 'components/Pin';
import Passphrase from 'components/Passphrase';
import Invalid from 'components/Invalid';
import Transaction from 'components/Transaction';

const device = {
    label: 'Test',
    path: 'test',
};

storiesOf('Device', module)
    .addWithJSX('Pin', () => (
        <Pin
            device={device}
            onPinSubmit={action('Pin submit')}
        />
    ))
    .addWithJSX('Pin Invalid', () => (
        <Invalid
            device={device}
        />
    ))
    .addWithJSX('Passphrase', () => (
        <Passphrase
            device={device}
            selectedDevice={device}
            onPassphraseSubmit={action('Passphrase submit')}
        />
    ))
    .addWithJSX('Transaction send', () => (
        <Transaction
            tx={{
                type: 'send',
                outputs: ['outputaddress'],
                total: '100',
                timestamp: '01/01/2019',
                hash: 'hashash',
            }}
            network={{
                symbol: 'BTC',
                explorer: {
                    tx: 'test',
                },
            }}
        />
    ))
    .addWithJSX('Transaction recieve', () => (
        <Transaction
            tx={{
                type: 'recieve',
                inputs: ['outputaddress'],
                total: '100',
                timestamp: '01/01/2019',
                hash: 'hashash',
            }}
            network={{
                symbol: 'BTC',
                explorer: {
                    tx: 'test',
                },
            }}
        />
    ));
