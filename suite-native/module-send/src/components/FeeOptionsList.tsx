import { D, pipe } from '@mobily/ts-belt';

import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountKey,
    GeneralPrecomposedLevels,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';

import { FeeOption } from './FeeOption';
import { NativeSupportedFeeLevel } from '../types';

type FeeOptionsListProps = {
    feeLevels: GeneralPrecomposedLevels;
    networkSymbol: NetworkSymbol;
    accountKey: AccountKey;
};

export const FeeOptionsList = ({ feeLevels, networkSymbol, accountKey }: FeeOptionsListProps) => {
    // Remove custom fee level from the list. It is not supported in the first version of the send flow.
    const predefinedFeeLevels = pipe(
        feeLevels,
        D.filterWithKey(key => key !== 'custom'),
    );

    // User is not able enter the fees screen if the normal (in final state) fee is not present.
    const normalLevel = predefinedFeeLevels.normal as PrecomposedTransactionFinal;
    const transactionBytes = normalLevel.bytes;

    return (
        <VStack spacing={12}>
            {Object.entries(predefinedFeeLevels).map(([feeKey, feeLevel]) => (
                <FeeOption
                    key={feeKey}
                    feeKey={feeKey as NativeSupportedFeeLevel}
                    feeLevel={feeLevel}
                    accountKey={accountKey}
                    networkSymbol={networkSymbol}
                    transactionBytes={transactionBytes}
                />
            ))}
        </VStack>
    );
};
