import BigNumber from 'bignumber.js';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { fromWei } from 'web3-utils';
import { useSelector } from 'src/hooks/suite';
import { DEFAULT_PAYMENT, DEFAULT_OPRETURN, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { getFeeLevels } from '@suite-common/wallet-utils';
import {
    SelectedAccountLoaded,
    Account,
    RbfTransactionParams,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { FormState, FeeInfo } from 'src/types/wallet/sendForm';
import { useFees } from './form/useFees';
import { useCompose } from './form/useCompose';
import { selectCurrentTargetAnonymity } from 'src/reducers/wallet/coinjoinReducer';
import { useCoinjoinRegisteredUtxos } from 'src/hooks/wallet/form/useCoinjoinRegisteredUtxos';
import { useBitcoinAmountUnit } from './useBitcoinAmountUnit';

export type UseRbfProps = {
    selectedAccount: SelectedAccountLoaded;
    rbfParams: RbfTransactionParams;
    finalize: boolean;
    chainedTxs: WalletAccountTransaction[];
};

const getBitcoinFeeInfo = (info: FeeInfo, feeRate: string) => {
    // increase FeeLevels for visual purpose (old rate + defined rate)
    // it will be decreased in sendFormAction before composing
    const levels = getFeeLevels('bitcoin', info).map(l => ({
        ...l,
        feePerUnit: new BigNumber(l.feePerUnit).plus(feeRate).toString(),
    }));
    return {
        ...info,
        levels,
        minFee: new BigNumber(feeRate).plus(info.minFee).toNumber(), // increase required minFee rate
    };
};

const getEthereumFeeInfo = (info: FeeInfo, gasPrice: string) => {
    const current = new BigNumber(gasPrice);
    const minFeeFromNetwork = new BigNumber(
        fromWei(info.levels[0].feePerUnit, 'gwei'),
    ).integerValue(BigNumber.ROUND_FLOOR);

    const getFee = () => {
        if (minFeeFromNetwork.lte(current)) {
            return current.plus(1);
        }
        return minFeeFromNetwork;
    };

    const fee = getFee();

    // increase FeeLevel only if it's lower than predefined
    const levels = getFeeLevels('ethereum', info).map(l => ({
        ...l,
        feePerUnit: fee.toString(),
    }));
    return {
        ...info,
        levels,
        minFee: current.plus(1).toNumber(), // increase required minFee rate
    };
};

const getFeeInfo = (
    networkType: Account['networkType'],
    info: FeeInfo,
    rbfParams: RbfTransactionParams,
) => {
    if (networkType === 'bitcoin') return getBitcoinFeeInfo(info, rbfParams.feeRate);
    if (networkType === 'ethereum') return getEthereumFeeInfo(info, rbfParams.feeRate);
    return info;
};

const useRbfState = ({ selectedAccount, rbfParams, finalize, chainedTxs }: UseRbfProps) => {
    const { account, network } = selectedAccount;

    const fees = useSelector(state => state.wallet.fees);
    const targetAnonymity = useSelector(selectCurrentTargetAnonymity);
    const coinjoinRegisteredUtxos = useCoinjoinRegisteredUtxos({ account });

    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);
    const coinFees = fees[account.symbol];

    return useMemo(() => {
        const feeInfo = getFeeInfo(account.networkType, coinFees, rbfParams);
        // filter out utxos generated by this transaction
        const otherUtxo = (account.utxo || []).filter(input => input.txid !== rbfParams.txid);
        // filter out utxos with anonymity level below target and currently registered
        const availableUtxo =
            account.accountType === 'coinjoin'
                ? otherUtxo.filter(
                      utxo =>
                          (account.addresses?.anonymitySet?.[utxo.address] || 1) >=
                              (targetAnonymity || 1) && !coinjoinRegisteredUtxos.includes(utxo),
                  )
                : otherUtxo;

        // override Account data
        const rbfAccount = {
            ...account,
            utxo: rbfParams.utxo.concat(availableUtxo),
            // make sure that the exact same change output will be picked by @trezor/connect > hd-wallet during the tx compose process
            // fallback to default if change address is not present
            addresses: account.addresses
                ? {
                      ...account.addresses,
                      change: rbfParams.changeAddress
                          ? [rbfParams.changeAddress]
                          : account.addresses.change,
                  }
                : undefined,
        };

        // transform original outputs
        const outputs = rbfParams.outputs.flatMap(o => {
            if (o.type === 'change') return [];
            if (o.type === 'opreturn') {
                return {
                    ...DEFAULT_OPRETURN,
                    dataHex: o.dataHex,
                    dataAscii: o.dataAscii,
                };
            }
            return {
                ...DEFAULT_PAYMENT,
                address: o.address,
                amount: shouldSendInSats ? o.amount : o.formattedAmount,
                token: o.token,
            };
        });
        // if there is no change output in the transaction **and** there is no other utxos to add try to decrease amount immediately
        // otherwise use decrease amount only as a fallback (see useEffect below)
        const setMaxOutputId =
            account.networkType === 'bitcoin' &&
            !rbfParams.outputs.some(o => o.type === 'change') &&
            availableUtxo.length < 1
                ? outputs.findIndex(o => o.type === 'payment')
                : undefined;

        let { baseFee } = rbfParams;
        if (chainedTxs.length > 0) {
            // increase baseFee, pay for all child chained transactions
            baseFee = chainedTxs.reduce((f, ctx) => f + parseFloat(ctx.fee), baseFee);
        }

        return {
            account: rbfAccount,
            network,
            feeInfo,
            coinjoinRegisteredUtxos,
            chainedTxs,
            shouldSendInSats,
            formValues: {
                ...DEFAULT_VALUES,
                outputs,
                selectedFee: undefined,
                setMaxOutputId,
                options: finalize ? ['broadcast'] : ['bitcoinRBF', 'broadcast'],
                ethereumDataHex: rbfParams.ethereumData,
                rbfParams: {
                    ...rbfParams,
                    baseFee,
                },
            } as FormState, // TODO: remove type casting (options string[])
        };
    }, [
        account,
        coinjoinRegisteredUtxos,
        chainedTxs,
        coinFees,
        finalize,
        network,
        rbfParams,
        shouldSendInSats,
        targetAnonymity,
    ]);
};

export const useRbf = (props: UseRbfProps) => {
    // local state
    const state = useRbfState(props);
    const { formValues, feeInfo, account } = state;

    const [isReduceChangePossible, setIsReduceChangePossible] = useState(false);
    const [showDecreasedOutputs, setShowDecreasedOutputs] = useState(false);

    // react-hook-form
    const useFormMethods = useForm<FormState>({ mode: 'onChange' });
    const { reset, register, control, setValue, getValues, formState } = useFormMethods;

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('outputs');
        register('setMaxOutputId');
        register('options');
    }, [register]);

    // react-hook-form reset, set default values
    useEffect(() => {
        reset(formValues);
    }, [formValues, reset]);

    // sub-hook
    const { isLoading, composeRequest, composedLevels, onFeeLevelChange, signTransaction } =
        useCompose({
            ...useFormMethods,
            state,
            defaultField: 'selectedFee',
        });

    // sub-hook
    const { changeFeeLevel } = useFees({
        defaultValue: formValues.selectedFee,
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        composedLevels,
        ...useFormMethods,
    });

    // handle `finalize` change
    const { finalize } = props;
    useEffect(() => {
        const rbfEnabled = (getValues('options') || []).includes('bitcoinRBF');
        if (finalize === rbfEnabled) {
            setValue('options', finalize ? ['broadcast'] : ['broadcast', 'bitcoinRBF']);
            composeRequest();
        }
    }, [finalize, getValues, setValue, composeRequest]);

    // If automatically composed transaction throws NOT-ENOUGH-FUNDS error
    useEffect(() => {
        if (account.networkType !== 'bitcoin' || !composedLevels) return;
        const { selectedFee, setMaxOutputId, outputs } = getValues();
        const tx = composedLevels[selectedFee || 'normal'];
        // sometimes tx is undefined (e.g. when fee level is changed during the initial compose)
        if (!tx) return;

        const isSetMaxUsed = typeof setMaxOutputId === 'number';
        if (tx.type === 'final') {
            if (!isSetMaxUsed) {
                // reducing change is possible. do not use DecreasedOutputs ever in that case
                setIsReduceChangePossible(true);
            } else {
                // show DecreasedOutputs view
                setShowDecreasedOutputs(true);
            }
        }

        if (!isReduceChangePossible && tx.type === 'error' && tx.error === 'NOT-ENOUGH-FUNDS') {
            // try again with decreased output (use set-max calculation on the first possible output)
            if (!isSetMaxUsed) {
                setValue(
                    'setMaxOutputId',
                    outputs.findIndex(o => o.type === 'payment'),
                );
                composeRequest();
            }
            // set-max was already used and still no effect?
            // do not try compose again and show error
        }
    }, [
        account.networkType,
        composedLevels,
        composeRequest,
        getValues,
        setValue,
        isReduceChangePossible,
    ]);

    return {
        ...state,
        isLoading,
        showDecreasedOutputs,
        register,
        control,
        formState,
        setValue,
        getValues,
        composedLevels,
        changeFeeLevel,
        composeRequest,
        signTransaction,
    };
};

// context accepts only valid state (non nullable account)
type RbfContextValues = ReturnType<typeof useRbf> & NonNullable<ReturnType<typeof useRbfState>>;

export const RbfContext = createContext<RbfContextValues | null>(null);
RbfContext.displayName = 'RbfContext';

// Used across rbf form components
// Provide combined context of `react-hook-form` with custom values as RbfContextValues
export const useRbfContext = () => {
    const ctx = useContext(RbfContext);
    if (ctx === null) throw Error('useRbfContext used without Context');
    return ctx;
};
