import { A, F, pipe } from '@mobily/ts-belt';

import { type SignValue } from '@suite-common/suite-types';
import { createSimpleTargetId } from '@suite-common/wallet-core';
import { type TransactionType } from '@suite-common/wallet-types';
import { type EnhancedVinVout, type Target } from '@trezor/blockchain-link-types';
import { isNotNullOrUndefined } from '@trezor/utils';

import { type AddressesType, type VinVoutAddress } from './types';

export const mapTransactionInputsOutputsToAddresses = ({
    inputsOutputs,
    addressesType,
    isSentTransactionType,
}: {
    inputsOutputs: EnhancedVinVout[] | Target[];
    addressesType: AddressesType;
    isSentTransactionType: boolean;
}) =>
    pipe(
        inputsOutputs,
        A.map(target => {
            const isChangeAddress =
                (isSentTransactionType &&
                    addressesType === 'outputs' &&
                    (target.isAccountOwned || target.isAccountTarget)) ??
                false;

            return target.addresses?.map(
                (address): VinVoutAddress => ({
                    address,
                    isChangeAddress,
                    outputIndex: target.n,
                    txTargetId: createSimpleTargetId(target),
                }),
            );
        }),
        A.filter(isNotNullOrUndefined),
        A.concatMany,
        F.toMutable,
    );

export const sortTargetAddressesToBeginning = (
    addresses: readonly VinVoutAddress[],
    targetAddresses: readonly VinVoutAddress[],
) =>
    F.toMutable(
        A.concat(
            A.intersection(addresses, targetAddresses),
            A.difference(addresses, targetAddresses),
        ),
    );

// describes if '+' or '-' sign should be shown as part of the transaction amount.
const transactionTypeToSignValueMap = {
    recv: 'positive',
    sent: 'negative',
    self: undefined,
    joint: undefined,
    contract: undefined,
    failed: undefined,
    unknown: undefined,
} as const satisfies Record<TransactionType, SignValue | undefined>;

export const getTransactionValueSign = (transactionType: TransactionType) =>
    transactionTypeToSignValueMap[transactionType];
