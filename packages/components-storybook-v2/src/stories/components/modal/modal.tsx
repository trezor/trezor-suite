import React from 'react';
import { H2, P, Modal } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';

const ModalWrapper = styled.div`
    padding: 30px 48px;
    width: 260px;
`;
const InputWrapper = styled.div`
    margin-top: 24px;
    margin-bottom: 10px;
    max-width: 260px;
`;
const PinRow = styled.div`
    display: flex;
    justify-content: space-between;
    button {
        width: 30%;
        height: 0;
        padding-bottom: 30%;
    }

    & + & {
        margin-top: 10px;
    }
`;

const PinFooter = styled.div`
    margin: 20px 0 10px 0;
    display: flex;
    flex-direction: column;
`;

ModalWrapper.displayName = 'ModalWrapper';
InputWrapper.displayName = 'InputWrapper';
PinRow.displayName = 'PinRow';
PinFooter.displayName = 'PinFooter';

storiesOf('Modal', module).add(
    'Hello world!',
    () => (
        <Modal cancelable cancelText="Close">
            <ModalWrapper>
                <H2>Hello world!</H2>
                <P>Some description.</P>
            </ModalWrapper>
        </Modal>
    ),
    {
        info: {
            text: `
            ~~~js
            import { Modal } from 'trezor-ui-components';
            ~~~

            ModalWrapper
            ~~~js
            const ModalWrapper = styled.div\`
                padding: 30px 48px;
            \`;
            ~~~
            `,
        },
    }
);
