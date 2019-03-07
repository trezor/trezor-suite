import Modal from 'components/Modal';

import ButtonText from 'components/buttons/Button';
import ButtonPin from 'components/buttons/Pin';
import InputPin from 'components/inputs/Pin';
import P from 'components/Paragraph';
import { H2 } from 'components/Heading';
import Link from 'components/Link';

import React from 'react';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import { withInfo } from '@storybook/addon-info';

const ModalWrapper = styled.div`
    padding: 30px 48px;
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

storiesOf('Examples', module)
    .addDecorator(
        withInfo({
            header: false,
            styles: {
                infoBody: {
                    border: 'none',
                    padding: '15px',
                },
            },
        })
    )
    .add(
        'Hello world!',
        () => (
            <Modal>
                <ModalWrapper>Hello world!</ModalWrapper>
            </Modal>
        ),
        {
            info: {
                text: `
            ## Import
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
    )
    .add(
        'Pin modal',
        () => (
            <Modal>
                <ModalWrapper>
                    <H2>Enter Trezor PIN</H2>
                    <P isSmaller>The PIN layout is displayed on your Trezor.</P>
                    <InputWrapper>
                        <InputPin onDeleteClick={() => {}} value="" />
                    </InputWrapper>
                    <PinRow>
                        <ButtonPin onClick={() => {}} />
                        <ButtonPin onClick={() => {}} />
                        <ButtonPin onClick={() => {}} />
                    </PinRow>
                    <PinRow>
                        <ButtonPin onClick={() => {}} />
                        <ButtonPin onClick={() => {}} />
                        <ButtonPin onClick={() => {}} />
                    </PinRow>
                    <PinRow>
                        <ButtonPin onClick={() => {}} />
                        <ButtonPin onClick={() => {}} />
                        <ButtonPin onClick={() => {}} />
                    </PinRow>
                    <PinFooter>
                        <ButtonText onClick={() => {}}>Enter PIN</ButtonText>
                        <P isSmaller>
                            Not sure how PIN works?
                            <Link isGreen href="https://wiki.trezor.io/User_manual:Entering_PIN">
                                Learn more
                            </Link>
                        </P>
                    </PinFooter>
                </ModalWrapper>
            </Modal>
        ),
        {
            info: {
                text: `
            ## Import
            ~~~js
            import {
                Modal, 
                ButtonText, 
                ButtonPin, 
                InputPin, 
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
                padding: 30px 45px;
            \`;
            ~~~

            InputWrapper
            ~~~js
            const InputWrapper = styled.div\`
                margin-top: 24px;
                margin-bottom: 10px;
                max-width: 260px;
            \`;
            ~~~

            PinRow
            ~~~js
            const PinRow = styled.div\`
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
            \`;
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
        }
    );
