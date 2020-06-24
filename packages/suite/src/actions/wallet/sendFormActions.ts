import BigNumber from 'bignumber.js';
import { Dispatch, GetState } from '@suite-types';
import * as accountActions from '@wallet-actions/accountActions';
import * as notificationActions from '@suite-actions/notificationActions';
import { SendContext } from '@wallet-hooks/useSendContext';
import { toWei } from 'web3-utils';
import { ZEC_SIGN_ENHANCEMENT, XRP_FLAG } from '@wallet-constants/sendForm';
import { ParsedURI } from '@wallet-utils/cryptoUriParser';
import { useForm } from 'react-hook-form';
import TrezorConnect, { FeeLevel, RipplePayment } from 'trezor-connect';
import { networkAmountToSatoshi, formatNetworkAmount } from '@wallet-utils/accountUtils';
import {
    calculateTotal,
    calculateMax,
    calculateEthFee,
    getFeeLevels,
    findActiveMaxId,
    updateMax,
    serializeEthereumTx,
    prepareEthereumTransaction,
} from '@wallet-utils/sendFormUtils';

export const composeRippleTransaction = (
    account: SendContext['account'],
    getValues: ReturnType<typeof useForm>['getValues'],
    selectedFee: SendContext['selectedFee'],
) => {
    const amount = getValues('amount-0');
    const address = getValues('address-0');
    const amountInSatoshi = networkAmountToSatoshi(amount, account.symbol).toString();
    const { availableBalance } = account;
    const feeInSatoshi = selectedFee.feePerUnit;
    const totalSpentBig = new BigNumber(calculateTotal(amountInSatoshi, feeInSatoshi));
    const max = new BigNumber(calculateMax(availableBalance, feeInSatoshi));
    const formattedMax = max.isLessThan('0')
        ? ''
        : formatNetworkAmount(max.toString(), account.symbol);

    const payloadData = {
        totalSpent: totalSpentBig.toString(),
        fee: feeInSatoshi,
        max: formattedMax,
    };

    if (!address && formattedMax !== '0') {
        return {
            type: 'nonfinal',
            ...payloadData,
        };
    }

    if (totalSpentBig.isGreaterThan(availableBalance)) {
        return {
            type: 'error',
            error: 'NOT-ENOUGH-FUNDS',
        };
    }

    return {
        type: 'final',
        ...payloadData,
    };
};

export const composeEthereumTransaction = (
    account: SendContext['account'],
    getValues: ReturnType<typeof useForm>['getValues'],
    selectedFee: SendContext['selectedFee'],
    token: SendContext['token'],
    setMax = false,
) => {
    const amount = getValues('amount-0');
    const address = getValues('address-0');
    const isFeeValid = !new BigNumber(selectedFee.feePerUnit).isNaN();
    const { availableBalance } = account;
    const feeInSatoshi = calculateEthFee(
        toWei(isFeeValid ? selectedFee.feePerUnit : '0', 'gwei'),
        selectedFee.feeLimit || '0',
    );
    const max = token
        ? new BigNumber(token.balance!)
        : new BigNumber(calculateMax(availableBalance, feeInSatoshi));
    // use max possible value or input.value
    // race condition when switching between tokens with set-max enabled
    // input still holds previous value (previous token max)
    const amountInSatoshi = setMax
        ? max.toString()
        : networkAmountToSatoshi(amount, account.symbol).toString();

    const totalSpentBig = new BigNumber(
        calculateTotal(token ? '0' : amountInSatoshi, feeInSatoshi),
    );

    let formattedMax = max.isLessThan('0') ? '0' : max.toString();

    if (!token) {
        formattedMax = max.isLessThan('0')
            ? '0'
            : formatNetworkAmount(max.toString(), account.symbol);
    }

    const payloadData = {
        totalSpent: totalSpentBig.toString(),
        fee: feeInSatoshi,
        feePerUnit: selectedFee.feePerUnit,
        max: formattedMax,
    };

    if (!address && formattedMax !== '0') {
        return {
            type: 'nonfinal',
            ...payloadData,
        };
    }

    if (totalSpentBig.isGreaterThan(availableBalance)) {
        const error = token ? 'NOT-ENOUGH-CURRENCY-FEE' : 'NOT-ENOUGH-FUNDS';
        return { type: 'error', error } as const;
    }

    return {
        type: 'final',
        ...payloadData,
    };
};

export const composeBitcoinTransaction = async (
    account: SendContext['account'],
    outputs: SendContext['outputs'],
    getValues: ReturnType<typeof useForm>['getValues'],
    selectedFee: SendContext['selectedFee'],
) => {
    if (!account.addresses || !account.utxo) return;

    const composedOutputs = outputs.map(output => {
        const amount = networkAmountToSatoshi(getValues(`amount-${output.id}`), account.symbol);
        const address = getValues(`address-${output.id}`);
        const isMaxActive = getValues(`setMax-${output.id}`) === 'active';
        // address is set
        if (address) {
            // set max without address
            if (isMaxActive) {
                return {
                    address,
                    type: 'send-max',
                } as const;
            }

            return {
                address,
                amount,
            } as const;
        }

        // set max with address only
        if (isMaxActive) {
            return {
                type: 'send-max-noaddress',
            } as const;
        }

        // set amount without address
        return {
            type: 'noaddress',
            amount,
        } as const;
    });

    const response = await TrezorConnect.composeTransaction({
        account: {
            path: account.path,
            addresses: account.addresses,
            utxo: account.utxo,
        },
        feeLevels: [selectedFee],
        outputs: composedOutputs,
        coin: account.symbol,
    });

    if (response.success) {
        if (response.payload[0].type !== 'error') {
            const max = new BigNumber(response.payload[0].max).isLessThan('0')
                ? '0'
                : formatNetworkAmount(response.payload[0].max.toString(), account.symbol);
            const fee = formatNetworkAmount(response.payload[0].fee.toString(), account.symbol);
            return { ...response.payload[0], max, fee };
        }

        return {
            type: 'error',
            error: response.payload[0].error,
        };
    }
};

export const onQrScan = (
    parsedUri: ParsedURI,
    outputId: number,
    setValue: ReturnType<typeof useForm>['setValue'],
) => {
    const { address = '', amount } = parsedUri;
    setValue(`address-${outputId}`, address);
    if (amount) {
        setValue(`amount-${outputId}`, amount);
    }
};

export const checkRippleEmptyAddress = async (
    symbol: SendContext['account']['symbol'],
    inputName: string,
    getValues: ReturnType<typeof useForm>['getValues'],
    setDestinationAddressEmpty: SendContext['setDestinationAddressEmpty'],
) => {
    const response = await TrezorConnect.getAccountInfo({
        coin: symbol,
        descriptor: getValues(inputName),
    });

    if (response.success) {
        setDestinationAddressEmpty(response.payload.empty);
    }
};

export const updateFeeLevel = async (
    account: SendContext['account'],
    coinFees: SendContext['coinFees'],
    token: SendContext['token'],
    setValue: ReturnType<typeof useForm>['setValue'],
    setSelectedFee: SendContext['setSelectedFee'],
    outputs: SendContext['outputs'],
    getValues: ReturnType<typeof useForm>['getValues'],
    clearError: ReturnType<typeof useForm>['clearError'],
    setError: ReturnType<typeof useForm>['setError'],
    fiatRates: SendContext['fiatRates'],
    setTransactionInfo: SendContext['setTransactionInfo'],
) => {
    const { networkType } = account;
    const updatedLevels = getFeeLevels(networkType, coinFees, !!token);
    const selectedFeeLevel = updatedLevels.find((level: FeeLevel) => level.label === 'normal');

    if (selectedFeeLevel) {
        if (networkType === 'ethereum') {
            setValue('ethereumGasPrice', selectedFeeLevel.feePerUnit);
            setValue('ethereumGasLimit', selectedFeeLevel.feeLimit);
        } else {
            setValue('customFee', null);
        }

        setSelectedFee(selectedFeeLevel);
        const activeMax = findActiveMaxId(outputs, getValues);
        await updateMax(
            activeMax,
            account,
            setValue,
            getValues,
            clearError,
            setError,
            selectedFeeLevel,
            outputs,
            token,
            fiatRates,
            setTransactionInfo,
        );
    }
};

export const sendBitcoinTransaction = (transactionInfo: SendContext['transactionInfo']) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const { selectedAccount } = getState().wallet;
    const { device } = getState().suite;
    if (selectedAccount.status !== 'loaded' || !device) return null;
    const { account } = selectedAccount;
    if (!transactionInfo || transactionInfo.type !== 'final') return;
    const { transaction } = transactionInfo;

    const inputs = transaction.inputs.map((input: any) => ({
        ...input,
        // sequence: BTC_RBF_SEQUENCE, // TODO: rbf is set
        // sequence: BTC_LOCKTIME_SEQUENCE, // TODO: locktime is set
    }));

    let signEnhancement = {};

    if (account.symbol === 'zec') {
        signEnhancement = ZEC_SIGN_ENHANCEMENT;
    }

    // connect undefined amount hotfix
    inputs.forEach((input: any) => {
        if (!input.amount) delete input.amount;
    });

    const signPayload = {
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
        outputs: transaction.outputs,
        inputs,
        coin: account.symbol,
        ...signEnhancement,
    };

    const signedTx = await TrezorConnect.signTransaction(signPayload);

    if (!signedTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            }),
        );
        return;
    }

    // TODO: add possibility to show serialized tx without pushing (locktime)
    const sentTx = await TrezorConnect.pushTransaction({
        tx: signedTx.payload.serializedTx,
        coin: account.symbol,
    });

    const spentWithoutFee = new BigNumber(transactionInfo.totalSpent)
        .minus(transactionInfo.fee)
        .toString();

    if (sentTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount: formatNetworkAmount(spentWithoutFee, account.symbol, true),
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: sentTx.payload.txid,
            }),
        );

        dispatch(accountActions.fetchAndUpdateAccount(account));
    } else {
        dispatch(
            notificationActions.addToast({ type: 'sign-tx-error', error: sentTx.payload.error }),
        );
    }
};

export const sendEthereumTransaction = (
    getValues: ReturnType<typeof useForm>['getValues'],
    token: SendContext['token'],
) => async (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount } = getState().wallet;
    const { device } = getState().suite;
    if (selectedAccount.status !== 'loaded' || !device) return null;
    const { account, network } = selectedAccount;

    const amount = getValues('amount-0');
    const address = getValues('address-0');
    const data = getValues('ethereumData');
    const gasPrice = getValues('ethereumGasPrice');
    const gasLimit = getValues('ethereumGasLimit');

    if (account.networkType !== 'ethereum' || !network.chainId || !amount || !address) return null;

    const transaction = prepareEthereumTransaction({
        token: token || undefined,
        chainId: network.chainId,
        to: address,
        amount,
        data,
        gasLimit,
        gasPrice,
        nonce: account.misc.nonce,
    });

    const signedTx = await TrezorConnect.ethereumSignTransaction({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
        path: account.path,
        transaction,
    });

    if (!signedTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            }),
        );
        return;
    }

    const serializedTx = serializeEthereumTx({
        ...transaction,
        ...signedTx.payload,
    });

    // TODO: add possibility to show serialized tx without pushing (locktime)
    const sentTx = await TrezorConnect.pushTransaction({
        tx: serializedTx,
        coin: network.symbol,
    });

    if (sentTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount: `${amount} ${
                    token ? token.symbol!.toUpperCase() : account.symbol.toUpperCase()
                }`,
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: sentTx.payload.txid,
            }),
        );
        dispatch(accountActions.fetchAndUpdateAccount(account));
    } else {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: sentTx.payload.error,
            }),
        );
    }
};

export const sendRippleTransaction = (
    getValues: ReturnType<typeof useForm>['getValues'],
    selectedFee: SendContext['selectedFee'],
) => async (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount } = getState().wallet;
    const { device } = getState().suite;
    if (selectedAccount.status !== 'loaded' || !device) return null;
    const { account } = selectedAccount;
    const { symbol, networkType } = account;

    if (networkType !== 'ripple' || !account || !account.misc) return null;

    const amount = getValues('amount-0');
    const address = getValues('address-0');
    const destinationTag = getValues('rippleDestinationTag');
    const { path, instance, state, useEmptyPassphrase } = device;

    const payment: RipplePayment = {
        destination: address,
        amount: networkAmountToSatoshi(amount, symbol),
    };

    if (destinationTag) {
        payment.destinationTag = parseInt(destinationTag, 10);
    }

    const signedTx = await TrezorConnect.rippleSignTransaction({
        device: {
            path,
            instance,
            state,
        },
        useEmptyPassphrase,
        path: account.path,
        transaction: {
            fee: selectedFee.feePerUnit,
            flags: XRP_FLAG,
            sequence: account.misc.sequence,
            payment,
        },
    });

    if (!signedTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            }),
        );
        return;
    }

    // TODO: add possibility to show serialized tx without pushing (locktime)
    const sentTx = await TrezorConnect.pushTransaction({
        tx: signedTx.payload.serializedTx,
        coin: account.symbol,
    });

    if (sentTx.success) {
        dispatch(
            notificationActions.addToast({
                type: 'tx-sent',
                formattedAmount: `${amount} ${account.symbol.toUpperCase()}`,
                device,
                descriptor: account.descriptor,
                symbol: account.symbol,
                txid: sentTx.payload.txid,
            }),
        );

        dispatch(accountActions.fetchAndUpdateAccount(account));
    } else {
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: sentTx.payload.error,
            }),
        );
    }
};
