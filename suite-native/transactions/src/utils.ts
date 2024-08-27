import { A, F, G, pipe } from '@mobily/ts-belt';

import { EnhancedVinVout, Target } from '@trezor/blockchain-link-types';
import { SignValue } from '@suite-common/suite-types';
import { TransactionType } from '@suite-common/wallet-types';

import { VinVoutAddress, AddressesType } from './types';

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
                }),
            );
        }),
        A.filter(G.isNotNullable),
        A.concatMany,
        F.toMutable,
    );

export const sortTargetAddressesToBeginning = (
    addresses: readonly VinVoutAddress[],
    targetAddresses: readonly VinVoutAddress[],
) =>
    A.concat(
        A.intersection(addresses, targetAddresses),
        A.difference(addresses, targetAddresses),
    ) as VinVoutAddress[];

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

export const getTransactionValueSign = (transactionType: TransactionType) => {
    return transactionTypeToSignValueMap[transactionType];
};
