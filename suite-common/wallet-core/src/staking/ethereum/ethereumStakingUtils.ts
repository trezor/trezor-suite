import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type SupportedEthereumNetworkSymbol,
    supportedNetworkSymbols,
} from '@suite-common/wallet-types';
import { fromHex, getSignatureByEthereumDataHex, isUnstakeTx } from '@suite-common/wallet-utils';
import { isArrayMember } from '@trezor/utils';

export function isSupportedEthStakingNetworkSymbol(
    symbol: NetworkSymbol,
): symbol is SupportedEthereumNetworkSymbol {
    return isArrayMember(symbol, supportedNetworkSymbols);
}

export const getUnstakeAmountByEthereumDataHex = (dataHex?: string) => {
    if (!dataHex) return null;

    // Check if the first two characters are '0x' and remove them if they are
    const data = dataHex.startsWith('0x') ? dataHex.slice(2) : dataHex;

    const signature = getSignatureByEthereumDataHex(data);
    if (!isUnstakeTx(signature)) return null;

    const dataBuffer = Buffer.from(data, 'hex');

    return fromHex(`0x${dataBuffer.subarray(4, 36).toString('hex')}`).toIntegerString();
};
