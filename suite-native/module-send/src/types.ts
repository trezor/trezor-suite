import { RefObject } from 'react';
import { TextInputProps } from 'react-native';

import type { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountKey,
    ReviewOutput,
    ReviewOutputState,
    TokenAddress,
} from '@suite-common/wallet-types';
import { InputType } from '@suite-native/atoms';
import { Utxo } from '@trezor/blockchain-link-types';

export type StatefulReviewOutput = ReviewOutput & { state: ReviewOutputState };

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
