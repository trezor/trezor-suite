import { SendContext } from '@suite/hooks/wallet/useSendContext';
import { WalletLayout } from '@wallet-components';
import { Card, Translation } from '@suite-components';
import React, { useState } from 'react';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components';
import Outputs from './components/Outputs';
import Clear from './components/Clear';
import AdvancedForm from './components/AdvancedForm';
import ReviewButton from './components/ReviewButton';
import { Props } from './Container';
import { useForm, FormContext } from 'react-hook-form';

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

export default ({
    device,
    fees,
    selectedAccount,
    locks,
    online,
    settings,
    fiat,
    localCurrency,
}: Props) => {
    if (!device || !fees || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Send" account={selectedAccount} />;
    }

    const { account, network } = selectedAccount;
    const { symbol, networkType } = account;
    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const initialSelectedFee = levels.find(l => l.label === 'normal') || levels[0];
    const initialOutputs = [
        {
            id: 0,
            'address-0': '',
            'amount-0': '',
            'settMaxActive-0': false,
            'fiatValue-0': '',
            'local-currency-0': { value: 'usd', label: 'USD' },
        },
    ];

    const [advancedForm, showAdvancedForm] = useState(false);
    const [token, setToken] = useState(null);
    const [feeOutdated, setFeeOutdated] = useState(false);
    const [transactionInfo, setTransactionInfo] = useState(null);
    const [selectedFee, setSelectedFee] = useState(initialSelectedFee);
    const [outputs, updateOutputs] = useState(initialOutputs);
    const defaultLocalCurrencyOption = { value: localCurrency, label: localCurrency.toUpperCase() };

    const methods = useForm({
        mode: 'onChange',
        defaultValues: {
            'address-0': '',
            'amount-0': '',
            'settMaxActive-0': false,
            'fiatValue-0': '',
            'local-currency-0': defaultLocalCurrencyOption,
            'ethereum-gas-price': initialSelectedFee.feePerUnit,
            'ethereum-gas-limit': initialSelectedFee.feeLimit,
            'ethereum-data': '',
        },
    });

    return (
        <WalletLayout title="Send" account={selectedAccount}>
            <SendContext.Provider
                value={{
                    feeInfo,
                    initialSelectedFee,
                    outputs,
                    network,
                    defaultLocalCurrencyOption,
                    updateOutputs,
                    transactionInfo,
                    setTransactionInfo,
                    token,
                    setToken,
                    selectedFee,
                    setSelectedFee,
                    advancedForm,
                    showAdvancedForm,
                    account,
                    settings,
                    fiat,
                    feeOutdated,
                    setFeeOutdated,
                    device,
                    online,
                    locks,
                }}
            >
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
                        <Outputs />
                        <AdvancedForm />
                        <ReviewButton />
                    </StyledCard>
                </FormContext>
            </SendContext.Provider>
        </WalletLayout>
    );
};
