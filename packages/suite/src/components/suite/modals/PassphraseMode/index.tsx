import { Button, H2, colors } from '@trezor/components-v2';
import React from 'react';
import styled, { css } from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
`;

const Col = styled.div<{ secondary?: boolean }>`
    display: flex;
    flex: 1;
    width: 320px;
    flex-direction: column;
    padding: 40px;
    align-items: center;

    ${props =>
        props.secondary &&
        css`
            background: ${colors.BLACK96};
        `}
`;

const Content = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    color: ${colors.BLACK50};
`;

const Actions = styled.div`
    margin-top: 20px;
`;

interface Props {
    onWalletTypeRequest: (type: boolean) => void;
    onCancel: () => void;
}

const PassphraseMode = (props: Props) => {
    return (
        <Wrapper>
            <Col>
                <H2>No-passphrase Wallet</H2>
                <Content>To access standard (no-passphrase) Wallet click the button below.</Content>
                <Actions>
                    <Button
                        variant="primary"
                        onClick={() => {
                            props.onWalletTypeRequest(false);
                        }}
                    >
                        Access standard Wallet
                    </Button>
                </Actions>
            </Col>
            <Col secondary>
                <H2>Passphrase-secured hidden Wallet</H2>
                <Content>
                    Enter existing passphrase to access existing hidden Wallet. Or enter new
                    passphrase to create a new hidden Wallet.
                </Content>
                <Actions>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            props.onWalletTypeRequest(true);
                        }}
                    >
                        Access Hidden Wallet
                    </Button>
                </Actions>
            </Col>
        </Wrapper>
    );
};

export default PassphraseMode;
