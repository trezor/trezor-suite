import Modal from 'components/Modal';
import Passphrase from 'components/Passphrase';
import Pin from 'components/Pin';
import React from 'react';
import { storiesOf } from '@storybook/react';

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
