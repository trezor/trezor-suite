import { getWrappedNativeAddress } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import { fromHex } from './ethConverter';
import { getSignatureByEthereumDataHex } from './ethereumStakingUtils';

// WETH9 deposit() / withdraw(uint256 wad) selectors.
const WRAP_SIGNATURE = '0xd0e30db0';
const UNWRAP_SIGNATURE = '0x2e1a7d4d';

const targetsWrappedNativeContract = (transaction: WalletAccountTransaction) => {
    const wrappedNativeAddress = getWrappedNativeAddress(transaction.symbol);
    const targetAddress = transaction.targets?.[0]?.addresses?.[0];

    return (
        !!wrappedNativeAddress &&
        !!targetAddress &&
        targetAddress.toLowerCase() === wrappedNativeAddress
    );
};

export const isWrapNativeTx = (transaction: WalletAccountTransaction) =>
    transaction.ethereumSpecific?.parsedData?.methodId?.toLowerCase() === WRAP_SIGNATURE &&
    targetsWrappedNativeContract(transaction);

export const isUnwrapNativeTx = (transaction: WalletAccountTransaction) =>
    transaction.ethereumSpecific?.parsedData?.methodId?.toLowerCase() === UNWRAP_SIGNATURE &&
    targetsWrappedNativeContract(transaction);

/** Unwrapped amount (wei) decoded from withdraw(wad) calldata. */
export const getUnwrapAmountByEthereumDataHex = (dataHex?: string) => {
    if (!dataHex) return null;

    const data = dataHex.startsWith('0x') ? dataHex.slice(2) : dataHex;

    if (getSignatureByEthereumDataHex(data) !== UNWRAP_SIGNATURE) return null;

    const dataBuffer = Buffer.from(data, 'hex');

    if (dataBuffer.length < 36) return null;

    return fromHex(`0x${dataBuffer.subarray(4, 36).toString('hex')}`).toIntegerString();
};
