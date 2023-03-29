import { AccountType, NetworkSymbol } from '@suite-common/wallet-config';
import { getXpubOrDescriptorInfo } from '@trezor/utxo-lib';

import { paymentTypeToAccountType } from './constants';

export const getAccountTypeFromDescriptor = (
    descriptor: string,
    networkSymbol: NetworkSymbol,
): AccountType => {
    // account type supported only for btc and ltc
    if (networkSymbol !== 'btc' && networkSymbol !== 'ltc') return 'imported';
    const { paymentType } = getXpubOrDescriptorInfo(descriptor);
    return paymentTypeToAccountType[paymentType];
};
