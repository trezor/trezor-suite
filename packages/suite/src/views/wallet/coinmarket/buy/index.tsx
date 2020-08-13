import { useSelector, useActions } from '@suite-hooks';
import { variables } from '@trezor/components';
import { CoinmarketFooter, CoinmarketLayout, WalletLayout } from '@wallet-components';
import { useBuyInfo } from '@wallet-hooks/useCoinmarket';
import PreviousTransactions from './PreviousTransactions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import { AmountLimits } from '@wallet-utils/coinmarket/buyUtils';
import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import styled from 'styled-components';

import Inputs from './Inputs';
import Footer from './Footer';

const Wrapper = styled.div``;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 25px;
    flex: 1;
`;

const Loading = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.BIG};
`;

const NoProviders = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.BIG};
`;

const CoinmarketBuy = () => {
    const methods = useForm({ mode: 'onChange' });
    const { saveBuyInfo } = useActions({ saveBuyInfo: coinmarketBuyActions.saveBuyInfo });
    const { buyInfo } = useBuyInfo();
    const [amountLimits, setAmountLimits] = useState<AmountLimits | undefined>(undefined);
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Coinmarket" account={selectedAccount} />;
    }

    saveBuyInfo(buyInfo);

    const { account } = selectedAccount;
    const isLoading = !buyInfo?.buyInfo;
    const noProviders =
        buyInfo.buyInfo?.providers.length === 0 ||
        !buyInfo.supportedCryptoCurrencies.has(account.symbol);

    return (
        <FormProvider {...methods}>
            <CoinmarketLayout
                bottom={
                    <>
                        <PreviousTransactions />
                        <CoinmarketFooter />
                    </>
                }
            >
                <Wrapper>
                    {isLoading && <Loading>loading</Loading>}
                    {!isLoading && noProviders && <NoProviders>No providers</NoProviders>}
                    {!isLoading && !noProviders && (
                        <Content>
                            <Inputs
                                amountLimits={amountLimits}
                                setAmountLimits={setAmountLimits}
                                buyInfo={buyInfo}
                            />
                            <Footer buyInfo={buyInfo} setAmountLimits={setAmountLimits} />
                        </Content>
                    )}
                </Wrapper>
            </CoinmarketLayout>
        </FormProvider>
    );
};

export default CoinmarketBuy;
