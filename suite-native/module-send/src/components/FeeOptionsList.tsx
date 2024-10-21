import { D, pipe } from '@mobily/ts-belt';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey, GeneralPrecomposedLevels } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';

import { FeeOption } from './FeeOption';
import { NativeSupportedFeeLevel } from '../types';

type FeeOptionsListProps = {
    feeLevels: GeneralPrecomposedLevels;
    networkSymbol: NetworkSymbol;
    accountKey: AccountKey;
};

// User is not able to enter the fees screen if there is not normal fee or at least the economy fee (in final state) present.
const getTransactionBytes = (feeLevels: Partial<GeneralPrecomposedLevels>) => {
    if (feeLevels.normal && 'bytes' in feeLevels.normal) {
        return feeLevels.normal.bytes;
    }

    if (feeLevels.economy && 'bytes' in feeLevels.economy) {
        return feeLevels.economy.bytes;
    }

    return 0;
};

export const FeeOptionsList = ({ feeLevels, networkSymbol, accountKey }: FeeOptionsListProps) => {
    // Remove custom fee level from the list. It is not supported in the first version of the send flow.
    const predefinedFeeLevels = pipe(
        feeLevels,
        D.filterWithKey(key => key !== 'custom'),
    );

    const transactionBytes = getTransactionBytes(predefinedFeeLevels);

    const isMultipleOptionsDisplayed = Object.keys(predefinedFeeLevels).length > 1;

    return (
        <VStack spacing="sp12">
            {Object.entries(predefinedFeeLevels).map(([feeKey, feeLevel]) => (
                <FeeOption
                    key={feeKey}
                    feeKey={feeKey as NativeSupportedFeeLevel}
                    feeLevel={feeLevel}
                    accountKey={accountKey}
                    networkSymbol={networkSymbol}
                    transactionBytes={transactionBytes}
                    isInteractive={isMultipleOptionsDisplayed}
                />
            ))}
        </VStack>
    );
};
