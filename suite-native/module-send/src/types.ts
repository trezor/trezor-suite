import { type RefObject } from 'react';
import { type TextInputProps } from 'react-native';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { type InputType } from '@suite-native/atoms';
import { type Utxo } from '@trezor/blockchain-link-types';

export type SendAmountInputProps = {
    recipientIndex: number;
    symbol: NetworkSymbol;
    inputRef?: RefObject<InputType | null>;
    accountKey?: AccountKey;
    tokenContract?: TokenAddress;
    isDisabled?: boolean;
    onPress?: TextInputProps['onPress'];
};

export type SelectedUtxos = { [accountKey: AccountKey]: Utxo[] };
