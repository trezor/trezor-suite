import { SendContext } from '@wallet-hooks/useSendContext';
import { WalletLayout } from '@wallet-components';
import { TokenInfo } from 'trezor-connect';
// import * as storageActions from '@suite-actions/storageActions';
import { Card, Translation } from '@suite-components';
import React, { useState, useEffect } from 'react';
import { getFeeLevels } from '@wallet-utils/sendFormUtils';
// import { getAccountKey } from '@wallet-utils/accountUtils';
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

export default ({ device, fees, selectedAccount, locks, online, fiat, localCurrency }: Props) => {
    if (!device || !fees || selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Send" account={selectedAccount} />;
    }

    const { account, network } = selectedAccount;
    const [feeOutdated, setFeeOutdated] = useState(false);
    const { symbol, networkType } = account;
    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    // const [cached, setCached] = useState<{
    //     data: Record<string, any> | null;
    //     outputs: SendContext['outputs'] | null;
    // }>({
    //     data: null,
    //     outputs: null,
    // });
    const fiatRates = fiat.coins.find(item => item.symbol === symbol);
    const initialSelectedFee = levels.find(l => l.label === 'normal') || levels[0];
    const [advancedForm, showAdvancedForm] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [destinationAddressEmpty, setDestinationAddressEmpty] = useState(false);
    const [token, setToken] = useState<TokenInfo | null>(null);
    const [transactionInfo, setTransactionInfo] = useState(null);
    const [selectedFee, setSelectedFee] = useState(initialSelectedFee);
    const localCurrencyOption = { value: localCurrency, label: localCurrency.toUpperCase() };
    const initialOutputs = [{ id: 0 }];
    const [outputs, updateOutputs] = useState(initialOutputs);

    useEffect(() => {}, [account.availableBalance]);

    // useEffect(() => {
    //     async function getCachedItem() {
    //         const accountKey = getAccountKey(
    //             account.descriptor,
    //             account.symbol,
    //             account.deviceState,
    //         );

    //         const cachedItem = await storageActions.loadSendForm(accountKey);
    //         if (cachedItem) {
    //             setCached(cachedItem);
    //         }
    //     }
    //     getCachedItem();
    // }, []);

    const defaultValues: SendContext['defaultValues'] = {
        address: [''],
        amount: [''],
        setMax: ['inactive'],
        fiatInput: [''],
        localCurrency: [localCurrencyOption],
        ethereumGasPrice: initialSelectedFee.feePerUnit,
        ethereumGasLimit: initialSelectedFee.feeLimit,
        ethereumData: '',
        rippleDestinationTag: '',
    };

    useEffect(() => {}, [account.availableBalance]);

    const methods = useForm({
        mode: 'onChange',
        defaultValues,
    });

    return (
        <WalletLayout title="Send" account={selectedAccount}>
            <SendContext.Provider
                value={{
                    feeInfo,
                    isLoading,
                    setLoading,
                    defaultValues,
                    initialSelectedFee,
                    outputs,
                    coinFees,
                    fiatRates,
                    destinationAddressEmpty,
                    setDestinationAddressEmpty,
                    network,
                    localCurrencyOption,
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
                                    <Translation id="SEND_TITLE" values={{ symbol }} />
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
