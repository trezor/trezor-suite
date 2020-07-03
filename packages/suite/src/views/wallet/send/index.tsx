import React from 'react';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components';

import { Card } from '@suite-components';
import { WalletLayout } from '@wallet-components';

import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import { useSendForm, SendContext } from '@wallet-hooks/useSendForm';

import Outputs from './components/Outputs';
import Clear from './components/Clear';
import Fees from './components/Fees';
import TotalSent from './components/TotalSent';
import AdvancedForm from './components/AdvancedForm';
import ReviewButton from './components/ReviewButton';
import { Props } from './Container';

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

export default ({ device, fees, selectedAccount, locks, online, fiat, localCurrency }: Props) => {
    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Send" account={selectedAccount} />;
    }

    const { account, network } = selectedAccount;
    const { symbol, networkType } = account;
    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const fiatRates = fiat.coins.find(item => item.symbol === symbol);
    const initialSelectedFee = levels.find(l => l.label === 'normal') || levels[0];
    const localCurrencyOption = { value: localCurrency, label: localCurrency.toUpperCase() };

    const sendState = useSendForm({
        device,
        account,
        network,
        coinFees,
        online,

        fiatRates,
        locks,
        feeInfo,
        initialSelectedFee,
        localCurrencyOption,
        destinationAddressEmpty: false,
        transactionInfo: null, // TODO: type
        token: null,
        feeOutdated: false,
        selectedFee: initialSelectedFee,
        advancedForm: false,
        isLoading: false,
    });

    return (
        <WalletLayout title="Send" account={selectedAccount}>
            <SendContext.Provider value={sendState}>
                <StyledCard
                    customHeader={
                        <Header>
                            <HeaderLeft />
                            <HeaderRight>
                                <Clear />
                            </HeaderRight>
                        </Header>
                    }
                >
                    <Outputs />
                    <AdvancedForm />
                </StyledCard>
                <Fees />
                <TotalSent />
                <ReviewButton />
            </SendContext.Provider>
        </WalletLayout>
    );
};
