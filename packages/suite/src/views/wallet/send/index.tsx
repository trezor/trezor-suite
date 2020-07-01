import React, { useEffect } from 'react';
import { useForm, FormContext } from 'react-hook-form';
import styled from 'styled-components';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { useActions } from '@suite-hooks';
import { variables, colors } from '@trezor/components';

import { WalletLayout } from '@wallet-components';
// import * as storageActions from '@suite-actions/storageActions';
import { Card, Translation } from '@suite-components';

import { getFeeLevels } from '@wallet-utils/sendFormUtils';
import { FormState } from '@wallet-types/sendForm';
import { useSendForm, SendContext } from '@wallet-hooks/useSendForm';

import Outputs from './components/Outputs';
import Clear from './components/Clear';
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

    const { getDraft, setLastUsedFeeLevel } = useActions({
        getDraft: sendFormActions.getDraft,
        setLastUsedFeeLevel: sendFormActions.setLastUsedFeeLevel,
    });

    // useEffect(() => {
    //     console.warn('--->>>selectedAccount.account MOUNT!', selectedAccount.account);
    //     return () => {
    //         console.warn('<<<---selectedAccount.account UNMOUNT', selectedAccount.account);
    //     };
    // }, [selectedAccount.account]);

    const { account, network } = selectedAccount;
    const { descriptor, deviceState, symbol, networkType } = account;
    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = { ...coinFees, levels };
    const fiatRates = fiat.coins.find(item => item.symbol === symbol);

    // useEffect(() => {
    //     // TODO: handle fee levels change (and update them)
    //     // TODO: precompose ALL levels, disable "unrealistic" levels
    //     console.warn('SET FEES!', coinFees);

    //     let loading = false;

    //     const precompose = async () => {
    //         loading = true;
    //         const freezed = coinFees;
    //         console.log('PREKO START', freezed);
    //         const f = await new Promise(resolve => {
    //             setTimeout(() => resolve(freezed), 1000);
    //         });

    //         console.log('FEES PRECOMPOSED', f, loading);
    //         loading = false;
    //     };

    //     precompose();

    //     return () => {
    //         loading = false;
    //     };
    // }, [coinFees]);

    // useEffect(() => {
    //     console.warn('SET BALANCE', account.balance);
    // }, [account.balance]);

    // TODO: exclude testnet from this hook
    // useEffect(() => {
    //     console.warn('SET FIAT', fiatRates.current);
    // }, [fiatRates.current]);

    // const [cached, setCached] = useState<{
    //     data: Record<string, any> | null;
    //     outputs: SendContext['outputs'] | null;
    // }>({
    //     data: null,
    //     outputs: null,
    // });

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

    const initialSelectedFee = levels.find(l => l.label === 'normal') || levels[0];
    const localCurrencyOption = { value: localCurrency, label: localCurrency.toUpperCase() };

    useEffect(() => {}, [account.availableBalance]);

    const draft = getDraft();
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
        outputs: [{ id: 0 }],
        isLoading: false,
    });

    const defaultValues: FormState = {
        // inputs
        address: [''],
        amount: [''],
        setMax: ['inactive'],
        setMaxOutputId: -1, // it has to be a number ??? investigate, otherwise watch() will not catch change [1 > null | undefined]
        fiatInput: [''],
        localCurrency: [localCurrencyOption],
        bitcoinLockTime: '',
        ethereumGasPrice: initialSelectedFee.feePerUnit,
        ethereumGasLimit: initialSelectedFee.feeLimit || '',
        ethereumData: '',
        rippleDestinationTag: '',
        ...(draft ? draft.formState : {}),
    };

    const methods = useForm({
        mode: 'onChange',
        defaultValues,
    });

    const { register } = methods;

    // register custom form values which doesn't have own HTMLElement
    useEffect(() => {
        register({ name: 'setMaxOutputId', type: 'custom' });
    }, [register]);

    // save initial selected fee to reduce
    useEffect(() => {
        setLastUsedFeeLevel(initialSelectedFee);
    }, [setLastUsedFeeLevel, initialSelectedFee]);

    return (
        <WalletLayout title="Send" account={selectedAccount}>
            <SendContext.Provider value={sendState}>
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
