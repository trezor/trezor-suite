import React from 'react';
import styled from 'styled-components';

import { Card } from '@suite-components';
import { WalletLayout } from '@wallet-components';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import { useSendForm, SendContext } from '@wallet-hooks/useSendForm';

import Outputs from './components/Outputs';
import Header from './components/Header';
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

const Send = ({ device, fees, selectedAccount, online, fiat, localCurrency }: Props) => {
    if (!device || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Send" account={selectedAccount} />;
    }

    const { account, network } = selectedAccount;
    const { symbol, networkType } = account;
    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const fiatRates = fiat.coins.find(item => item.symbol === symbol);
    const localCurrencyOption = { value: localCurrency, label: localCurrency.toUpperCase() };

    // It's OK to call this hook conditionally
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const sendState = useSendForm({
        device,
        account,
        network,
        coinFees,
        online,
        fiatRates,
        feeInfo,
        localCurrencyOption,
        destinationAddressEmpty: false,
        token: null,
        feeOutdated: false,
        isLoading: false,
    });

    return (
        <WalletLayout title="Send" account={selectedAccount}>
            <SendContext.Provider value={sendState}>
                <StyledCard customHeader={<Header />}>
                    <Outputs />
                    <CoinActions />
                </StyledCard>
                <Fees />
                <TotalSent />
                <ReviewButton />
            </SendContext.Provider>
        </WalletLayout>
    );
};

export default Send;
