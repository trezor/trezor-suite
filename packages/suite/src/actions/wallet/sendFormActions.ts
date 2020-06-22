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
} from '@wallet-utils/sendFormUtils';

export const composeRippleTransaction = (
    account: SendContext['account'],
    address: string,
    amount: string,
    selectedFee: SendContext['selectedFee'],
) => {
    const amountInSatoshi = networkAmountToSatoshi(amount, account.symbol).toString();
    const { availableBalance } = account;
    const feeInSatoshi = selectedFee.feePerUnit;
    const totalSpentBig = new BigNumber(calculateTotal(amountInSatoshi, feeInSatoshi));
    const max = new BigNumber(calculateMax(availableBalance, feeInSatoshi));
    const payloadData = {
        totalSpent: totalSpentBig.toString(),
        fee: feeInSatoshi,
        max: max.isLessThan('0') ? '0' : formatNetworkAmount(max.toString(), account.symbol),
    };

    if (!address) {
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
    address: string,
    amount: string,
    selectedFee: SendContext['selectedFee'],
    token: SendContext['token'],
    setMax = false,
) => {
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

    if (totalSpentBig.isGreaterThan(availableBalance)) {
        const error = token ? 'NOT-ENOUGH-CURRENCY-FEE' : 'NOT-ENOUGH-FUNDS';
        return { type: 'error', error } as const;
    }

    if (!address) {
        return {
            type: 'nonfinal',
            ...payloadData,
        };
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
    setMax = false,
) => {
    if (!account.addresses || !account.utxo) return;

    const composedOutputs = outputs.map(output => {
        const amount = networkAmountToSatoshi(getValues(`amount-${output.id}`), account.symbol);
        const address = getValues(`address-${output.id}`);
        // address is set
        if (address) {
            // set max without address
            if (setMax) {
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
        if (setMax) {
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

    const resp = await TrezorConnect.composeTransaction({
        account: {
            path: account.path,
            addresses: account.addresses,
            utxo: account.utxo,
        },
        feeLevels: [selectedFee],
        outputs: composedOutputs,
        coin: account.symbol,
    });

    if (resp.success && resp.payload[0].type !== 'error') {
        const max = new BigNumber(resp.payload[0].max).isLessThan('0')
            ? '0'
            : formatNetworkAmount(resp.payload[0].max.toString(), account.symbol);
        const fee = formatNetworkAmount(resp.payload[0].fee.toString(), account.symbol);
        return { ...resp.payload[0], max, fee };
    }

    return {
        type: 'error',
        // @ts-ignore
        error: resp.payload.error,
    };
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

export const updateFeeOrNotify = (
    account: SendContext['account'],
    coinFees: SendContext['coinFees'],
    token: SendContext['token'],
    selectedFee: SendContext['selectedFee'],
    setFeeOutdated: SendContext['setFeeOutdated'],
    setValue: ReturnType<typeof useForm>['setValue'],
    setSelectedFee: SendContext['setSelectedFee'],
) => {
    const { networkType } = account;
    const updatedLevels = getFeeLevels(networkType, coinFees, !!token);
    const selectedFeeLevel = updatedLevels.find(
        (level: FeeLevel) => level.label === selectedFee.label,
    );

    if (selectedFee.label === 'custom') {
        setFeeOutdated(true);
    } else if (selectedFeeLevel) {
        if (networkType === 'ethereum') {
            setValue('ethereumGasPrice', selectedFeeLevel.feePerUnit);
            setValue('ethereumGasLimit', selectedFeeLevel.feeLimit);
        }

        setSelectedFee(selectedFeeLevel);
    }
};

export const manuallyUpdateFee = (
    account: SendContext['account'],
    coinFees: SendContext['coinFees'],
    token: SendContext['token'],
    selectedFee: SendContext['selectedFee'],
    setValue: ReturnType<typeof useForm>['setValue'],
    setSelectedFee: SendContext['setSelectedFee'],
    setFeeOutdated: SendContext['setFeeOutdated'],
) => {
    const { networkType } = account;
    const updatedLevels = getFeeLevels(networkType, coinFees, !!token);
    const selectedFeeLevel = updatedLevels.find(
        (level: FeeLevel) => level.label === selectedFee.label,
    );

    if (selectedFeeLevel) {
        if (networkType === 'ethereum') {
            setValue('ethereumGasPrice', selectedFeeLevel.feePerUnit);
            setValue('ethereumGasLimit', selectedFeeLevel.feeLimit);
        }

        setSelectedFee(selectedFeeLevel);
        setFeeOutdated(false);
    }
};
