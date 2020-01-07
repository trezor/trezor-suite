import React from 'react';
import { H2, P, Modal } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';

storiesOf('Modals', module)
    .add(
        'Small',
        () => (
            <Modal cancelable cancelText="Close" size="small" data-test="modal-small">
                <H2>Hello world!</H2>
                <P>Some description.</P>
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
        'Medium',
        () => (
            <Modal cancelable cancelText="Close" data-test="modal-medium">
                <H2>Hello world!</H2>
                <P>Some description.</P>
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
        'Large',
        () => (
            <Modal cancelable cancelText="Close" size="large" data-test="modal-large">
                <H2>Hello world!</H2>
                <P>Some description.</P>
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
