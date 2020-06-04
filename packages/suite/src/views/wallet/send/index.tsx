/* eslint-disable react-hooks/exhaustive-deps */
import { WalletLayout } from '@wallet-components';
import { Card, Translation } from '@suite-components';
import React, { useState } from 'react';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components';
import Add from './components/Add';
import Address from './components/Address';
import AdditionalForm from './components/AdvancedForm';
import Amount from './components/Amount/Container';
import ButtonToggleAdditional from './components/ButtonToggleAdditional';
import Clear from './components/Clear';
import OutputHeader from './components/OutputHeader';
import ReviewButtonSection from './components/ReviewButtonSection';
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

const output = {
    id: 0,
    address: '',
    amount: '',
    setMax: false,
    fiatValue: '',
    localCurrency: { value: 'usd', label: 'USD' },
};

const defaultValues = {
    'address-0': '',
    'amount-0': '',
    'fiatValue-0': '',
    fiatCurrency: '',
    fee: '1',
    feeLimit: '1',
};

export default ({ device, fees, selectedAccount, locks, online }: Props) => {
    if (!device || !fees || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Send" account={selectedAccount} />;
    }

    const methods = useForm({ mode: 'onChange', defaultValues });
    const [isAdditionalFormVisible, setAdditionFormVisibility] = useState(false);
    const [outputs, addOutput] = useState([output]);
    const [selectedFee, setSelectedFee] = useState({ value: 1, label: 1 });
    const { account } = selectedAccount;
    const { networkType, symbol } = account;

    return (
        <WalletLayout title="Send" account={selectedAccount}>
            <FormContext {...methods}>
                <StyledCard
                    customHeader={
                        <Header>
                            <HeaderLeft>
                                <Translation
                                    id="SEND_TITLE"
                                    values={{ symbol: symbol.toUpperCase() }}
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
                            <OutputHeader outputsCount={outputs.length} outputId={output.id} />
                            <Row>
                                <Address outputId={output.id} account={account} />
                            </Row>
                            <Row>
                                <Amount outputId={output.id} account={account} />
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
                                <Add addOutput={addOutput} networkType={networkType} />
                            </AdditionalFormHeader>
                            {isAdditionalFormVisible && (
                                <AdditionalForm networkType={networkType} />
                            )}
                        </Row>
                    </AdditionalInfoWrapper>
                    <ReviewButtonSection device={device} locks={locks} online={online} />
                </StyledCard>
            </FormContext>
        </WalletLayout>
    );
};
