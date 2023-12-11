import { A, F, G, pipe } from '@mobily/ts-belt';

import { EnhancedVinVout, Target } from '@trezor/blockchain-link-types';

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
