import { A, G, pipe } from '@mobily/ts-belt';

import { EnhancedVinVout, Target } from '@trezor/blockchain-link-types';

export const mapTransactionInputsOutputsToAddresses = (
    inputsOutputs: EnhancedVinVout[] | Target[],
) =>
    pipe(
        inputsOutputs,
        A.map(target => target.addresses),
        A.filter(G.isNotNullable),
        A.concatMany,
    );

export const sortTargetAddressesToBeginning = (
    addresses: readonly string[],
    targetAddresses: readonly string[],
) =>
    A.concat(
        A.intersection(addresses, targetAddresses),
        A.difference(addresses, targetAddresses),
    ) as string[];
