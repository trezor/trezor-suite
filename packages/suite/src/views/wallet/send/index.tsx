/* eslint-disable react-hooks/exhaustive-deps */
import { WalletLayout } from '@wallet-components';
import { Card, Translation } from '@suite-components';
import { Output } from '@wallet-types/sendForm';
import React, { useState } from 'react';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components';
import Add from './components/Add/Container';
import Address from './components/Address';
import AdditionalForm from './components/AdvancedForm';
import Amount from './components/Amount/Container';
import ButtonToggleAdditional from './components/ButtonToggleAdditional';
import Clear from './components/Clear/Container';
import OutputHeader from './components/OutputHeader';
import ReviewButtonSection from './components/ReviewButtonSection/Container';
import { Props } from './Container';
import { useForm, FormContext } from 'react-hook-form';

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
    padding: 0 12px 12px 12px;
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }
`;

const AdditionalInfoWrapper = styled.div`
    margin-top: 20px;
`;

const AdditionalFormHeader = styled.div`
    padding: 5px 12px;
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
`;

const output: Output = {
    id: 0,
    address: { value: null, error: null },
    amount: { value: null, error: null },
    setMax: false,
    fiatValue: { value: null },
    localCurrency: { value: 'usd' },
};

const defaultValues = {
    address: '',
    amount: '',
    fiat: '',
    fiatCurrency: '',
    fee: '1',
    feeLimit: '1',
};

export default ({ device, fees, selectedAccount }: Props) => {
    if (!device || !fees || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Send" account={selectedAccount} />;
    }

    const methods = useForm({ mode: 'onChange', defaultValues });
    const [isAdditionalFormVisible, setAdditionFormVisibility] = useState(false);
    const [outputs, addOutput] = useState([output]);
    const { network, account } = selectedAccount;

    return (
        <WalletLayout title="Send" account={selectedAccount}>
            <FormContext {...methods}>
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
                    {outputs.map((output: any) => (
                        <OutputWrapper key={output.id}>
                            <OutputHeader outputs={outputs} output={output} />
                            <Row>
                                <Address output={output} />
                            </Row>
                            <Row>
                                <Amount output={output} />
                            </Row>
                        </OutputWrapper>
                    ))}
                    <AdditionalInfoWrapper>
                        <Row isColumn={isAdditionalFormVisible}>
                            <AdditionalFormHeader>
                                <ButtonToggleAdditional
                                    isAdditionalFormVisible={isAdditionalFormVisible}
                                    setAdditionFormVisibility={setAdditionFormVisibility}
                                />
                                <Add />
                            </AdditionalFormHeader>
                            {isAdditionalFormVisible && (
                                <AdditionalForm networkType={network.networkType} />
                            )}
                        </Row>
                    </AdditionalInfoWrapper>
                    <ReviewButtonSection />
                </StyledCard>
            </FormContext>
        </WalletLayout>
    );
};
