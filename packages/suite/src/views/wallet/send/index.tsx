import React, { useState } from 'react';
import styled from 'styled-components';

import { Card } from '@suite-components';
import { WalletLayout } from '@wallet-components';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import { useSendForm, SendContext } from '@wallet-hooks/useSendForm';

import Outputs from './components/Outputs';
import Header from './components/Header';
import OpReturn from './components/OpReturn';
import Fees from './components/Fees';
import CoinActions from './components/CoinActions';
import TotalSent from './components/TotalSent';
import ReviewButton from './components/ReviewButton';
import { Props } from './Container';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
    margin-bottom: 25px;
    padding: 0;
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
    const [opReturnActive, setOpReturnActive] = useState<boolean>(false);

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
                <StyledCard customHeader={<Header setOpReturnActive={setOpReturnActive} />}>
                    <Outputs />
                    <CoinActions />
                </StyledCard>
                {networkType === 'bitcoin' && opReturnActive && (
                    <OpReturn setIsActive={setOpReturnActive} />
                )}
                <Fees />
                <TotalSent />
                <ReviewButton />
            </SendContext.Provider>
        </WalletLayout>
    );
};
