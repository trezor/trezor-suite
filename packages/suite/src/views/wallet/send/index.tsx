/* eslint-disable react-hooks/exhaustive-deps */
import { WalletLayout } from '@wallet-components';
import { Card, Translation } from '@suite-components';
import { Output } from '@wallet-types/sendForm';
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components';
import Add from './components/Add/Container';
import Address from './components/Address/Container';
import AdditionalForm from './components/AdvancedForm';
import Amount from './components/Amount/Container';
import ButtonToggleAdditional from './components/ButtonToggleAdditional';
import Clear from './components/Clear/Container';
import OutputHeader from './components/OutputHeader';
import ReviewButtonSection from './components/ReviewButtonSection/Container';
import { Props } from './Container';

const Row = styled.div`
    display: flex;
    flex-direction: ${(props: { isColumn?: boolean }) => (props.isColumn ? 'column' : 'row')};
    padding: 0 0 30px 0;

    &:last-child {
        padding: 0;
    }
`;

const Header = styled.div`
    display: flex;
    padding: 6px 12px;
`;

const HeaderLeft = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-transform: uppercase;
    color: ${colors.BLACK50};
`;

const HeaderRight = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex: 1;
`;

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    margin-bottom: 40px;
`;

const OutputWrapper = styled.div`
    padding: 0 12px 0 12px;
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const AdditionalInfoWrapper = styled.div``;

const AdditionalFormHeader = styled.div`
    padding: 5px 12px;
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
`;

const Send = ({
    device,
    send,
    fees,
    selectedAccount,
    sendFormActions,
    sendFormActionsBitcoin,
}: Props) => {
    const descriptor = selectedAccount.account ? selectedAccount.account.descriptor : '';

    useEffect(() => {
        sendFormActions.init();
    }, [descriptor]);

    if (!device || !send || !fees || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Send" account={selectedAccount} />;
    }

    const { network, account } = selectedAccount;

    return (
        <WalletLayout title="Send" account={selectedAccount}>
            <StyledCard
                customHeader={
                    <Header>
                        <HeaderLeft>
                            <Translation
                                id="SEND_TITLE"
                                values={{ symbol: account.symbol.toUpperCase() }}
                            />
                        </HeaderLeft>
                        <HeaderRight>
                            <Clear />
                        </HeaderRight>
                    </Header>
                }
            >
                {send.outputs.map((output: Output) => (
                    <OutputWrapper key={output.id}>
                        <OutputHeader
                            outputs={send.outputs}
                            output={output}
                            sendFormActionsBitcoin={sendFormActionsBitcoin}
                        />
                        <Row>
                            <Address output={output} />
                        </Row>
                        <Row>
                            <Amount output={output} />
                        </Row>
                    </OutputWrapper>
                ))}
                <AdditionalInfoWrapper>
                    <Row isColumn={send.isAdditionalFormVisible}>
                        <AdditionalFormHeader>
                            <ButtonToggleAdditional
                                isActive={send.isAdditionalFormVisible}
                                sendFormActions={sendFormActions}
                            />
                            <Add />
                        </AdditionalFormHeader>
                        {send.isAdditionalFormVisible && (
                            <AdditionalForm networkType={network.networkType} />
                        )}
                    </Row>
                </AdditionalInfoWrapper>
                <ReviewButtonSection />
            </StyledCard>
        </WalletLayout>
    );
};

export default Send;
