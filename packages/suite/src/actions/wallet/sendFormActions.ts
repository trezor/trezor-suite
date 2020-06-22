import BigNumber from 'bignumber.js';
import { SendContext } from '@wallet-hooks/useSendContext';
import { toWei } from 'web3-utils';
import { ParsedURI } from '@wallet-utils/cryptoUriParser';
import { useForm } from 'react-hook-form';
import TrezorConnect, { FeeLevel } from 'trezor-connect';
import { networkAmountToSatoshi, formatNetworkAmount } from '@wallet-utils/accountUtils';
import {
    calculateTotal,
    calculateMax,
    calculateEthFee,
    getFeeLevels,
    findActiveMaxId,
    updateMax,
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
