import React from 'react';
import { H2, P, Modal } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

storiesOf('Modals', module)
    .add(
        'Default',
        () => (
            <Modal cancelText="Close" data-test="modal-small">
                <H2>Ahoj kamaráde!</H2>
                <P>Ježíš tě strašně miluje.</P>
            </Modal>
        ),
        {
            info: {
                text: `
            ~~~js
            import { Modal } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    )
    .add(
        'padding with cancel',
        () => (
            <Modal
                padding="50px 20px"
                cancelable
                cancelText="Zavři už tenhle trapnej modálek"
                data-test="modal-medium"
            >
                <H2>Ježíš tě má hrozně rád kamaráde!</H2>
                <P>Páček slimáček.</P>
            </Modal>
        ),
        {
            info: {
                text: `
            ~~~js
            import { Modal } from 'trezor-ui-components';
            ~~~
            `,
            },
        }
    );
