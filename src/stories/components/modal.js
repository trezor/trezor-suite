import Modal from 'components/Modal';

import ButtonText from 'components/buttons/Button';
import PinButton from 'components/buttons/Pin';
import PinInput from 'components/inputs/Pin';
import P from 'components/Paragraph';
import { H2 } from 'components/Heading';
import Link from 'components/Link';

import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import { withInfo } from '@storybook/addon-info';

const ModalWrapper = styled.div`
    padding: 25px;
`;
const InputWrapper = styled.div`
    margin-top: 24px;
    max-width: 260px;
`;
const PinRow = styled.div``;
const PinFooter = styled.div`
    margin: 20px 0 10px 0;
    display: flex;
    flex-direction: column;
`;

ModalWrapper.displayName = 'ModalWrapper';
InputWrapper.displayName = 'InputWrapper';
PinRow.displayName = 'PinRow';
PinFooter.displayName = 'PinFooter';

storiesOf('Modal', module)
    .addDecorator(
        withInfo({
            header: false,
            styles: {
                infoBody: {
                    border: 'none',
                    padding: '15px',
                }
            }
        }),
    )
    .add('Hello world!', () => (
        <Modal>
            <ModalWrapper>Hello world!</ModalWrapper>
        </Modal>
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import { Modal } from 'trezor-ui-components';
            ~~~

            ModalWrapper
            ~~~js
            const ModalWrapper = styled.div\`
                padding: 25px;
            \`;
            ~~~
            `,
        },
    })
    .add('Pin modal', () => (
        <Modal>
            <ModalWrapper>
                <H2>Enter Trezor PIN</H2>
                <P isSmaller>The PIN layout is displayed on your Trezor.</P>
                <InputWrapper>
                    <PinInput onDeleteClick={() => {}} value="" />
                </InputWrapper>
                <PinRow>
                    <PinButton>&#8226;</PinButton>
                    <PinButton>&#8226;</PinButton>
                    <PinButton>&#8226;</PinButton>
                </PinRow>
                <PinRow>
                    <PinButton>&#8226;</PinButton>
                    <PinButton>&#8226;</PinButton>
                    <PinButton>&#8226;</PinButton>
                </PinRow>
                <PinRow>
                    <PinButton>&#8226;</PinButton>
                    <PinButton>&#8226;</PinButton>
                    <PinButton>&#8226;</PinButton>
                </PinRow>
                <PinFooter>
                    <ButtonText>Enter PIN</ButtonText>
                    <P isSmaller>
                        Not sure how PIN works?
                        <Link
                            isGreen
                            href="https://wiki.trezor.io/User_manual:Entering_PIN"
                        >Learn more
                        </Link>
                    </P>
                </PinFooter>
            </ModalWrapper>
        </Modal>
    ), {
        info: {
            text: `
            ## Import
            ~~~js
            import {
                Modal, 
                ButtonText, 
                PinButton, 
                PinInput, 
                P, 
                H2, 
                Link 
            } from 'trezor-ui-components';
            ~~~

            #### We need to create few styled components to build up the Pin Modal.
            ---

            ModalWrapper
            ~~~js
            const ModalWrapper = styled.div\`
                padding: 25px;
            \`;
            ~~~

            InputWrapper
            ~~~js
            const InputWrapper = styled.div\`
                margin-top: 24px;
                max-width: 260px;
            \`;
            ~~~

            PinRow
            ~~~js
            const PinRow = styled.div\`\`;
            ~~~

            PinFooter
            ~~~js
            const PinFooter = styled.div\`
                margin: 20px 0 10px 0;
                display: flex;
                flex-direction: column;
            \`;
            ~~~
            `,
        },
    });
