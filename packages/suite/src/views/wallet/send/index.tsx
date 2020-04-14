/* eslint-disable react-hooks/exhaustive-deps */
import { WalletLayout } from '@wallet-components';
import { Card } from '@suite-components';
import { Output } from '@wallet-types/sendForm';
import React, { useEffect } from 'react';
import styled from 'styled-components';
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

const StyledCard = styled(Card)`
    display: flex;
    padding: 20px;
    flex-direction: column;
    margin-bottom: 40px;
`;

const OutputWrapper = styled.div`
    padding: 23px 40px 60px 40px;
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const AdditionalInfoWrapper = styled.div`
    margin-top: 20px;
`;

const AdditionalFormHeader = styled.div`
    padding: 5px 40px;
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
`;

export default ({
    device,
    send,
    fees,
    selectedAccount,
    sendFormActions,
    sendFormActionsBitcoin,
}: Props) => {
    useEffect(() => {
        sendFormActions.init();
    }, [selectedAccount]);

    if (!device || !send || !fees || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Send" account={selectedAccount} />;
    }

    const { network } = selectedAccount;

    return (
        <WalletLayout title="Send" account={selectedAccount}>
            <StyledCard>
                <Clear />
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
