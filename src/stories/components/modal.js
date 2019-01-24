import React from 'react';

import { storiesOf } from '@storybook/react';

import Modal from 'components/Modal';
import Pin from 'components/Pin';
import Passphrase from 'components/Passphrase';

const device = {
    label: 'Test',
    path: 'test',
};

storiesOf('Modal', module)
    .addWithJSX('Hello world!', () => (
        <Modal
            modal={{
                content: 'Hello world!',
            }}
        />
    ))
    .addWithJSX('Pin modal', () => (
        <Modal
            modal={{
                content: <Pin
                    device={device}
                    onPinSubmit={() => {}}
                />,
            }}
        />
    ))
    .addWithJSX('Passphrase modal', () => (
        <Modal
            modal={{
                content: <Passphrase
                    device={device}
                    onPassphraseSubmit={() => {}}
                />,
            }}
        />
    ));
