import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey, FormState } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { CustomFee } from './CustomFee/CustomFee';
import { FeeOptionsList, FeeOptionsListProps } from './FeeOptionList/FeeOptionsList';
import { NativeSupportedFeeLevel } from '../../types/fees';

type FeesContentProps = {
    selectedFeeLevel: NativeSupportedFeeLevel;
    feeLevels: FeeOptionsListProps['feeLevels'];
    symbol: NetworkSymbol;
    accountKey: AccountKey;
    areFeesLoading: boolean;
    onSelectedFeeLevel: FeeOptionsListProps['onSelectedFeeLevel'];
    onCustomFeeSet: (feePerUnit: string, feeLimit?: string) => void;
    formDraft: FormState | null | undefined;
};

export const FeesContent = ({
    selectedFeeLevel,
    feeLevels,
    symbol,
    accountKey,
    areFeesLoading,
    onSelectedFeeLevel,
    onCustomFeeSet,
    formDraft,
}: FeesContentProps) => (
    <VStack spacing="sp16">
        <VStack spacing="sp4">
            <Text variant="titleSmall">
                <Translation id="transactionManagement.fees.description.title" />
            </Text>
            <Text>
                <Translation id="transactionManagement.fees.description.body" />
            </Text>
        </VStack>
        <VStack spacing="sp24">
            {selectedFeeLevel !== 'custom' && (
                <FeeOptionsList
                    feeLevels={feeLevels}
                    symbol={symbol}
                    isLoading={areFeesLoading}
                    onSelectedFeeLevel={onSelectedFeeLevel}
                />
            )}
            <CustomFee
                symbol={symbol}
                accountKey={accountKey}
                onCustomFeeSet={onCustomFeeSet}
                formDraft={formDraft}
            />
        </VStack>
    </VStack>
);
