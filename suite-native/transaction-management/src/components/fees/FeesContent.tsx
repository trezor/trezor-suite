import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { type AccountKey, type FeeLevelLabel, type FormState } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { CustomFee } from './CustomFee/CustomFee';
import { FeeLabelTranslation } from './FeeLabelTranslation';
import { FeeOptionsList, type FeeOptionsListProps } from './FeeOptionList/FeeOptionsList';
import { getFeeLabelTranslationId } from './feesLabelUtils';
import { type CustomFeeParams } from '../../hooks';

export type FeesContentProps = {
    selectedFeeLevel: FeeLevelLabel;
    feeLevels: FeeOptionsListProps['feeLevels'];
    symbol: NetworkSymbol;
    accountKey: AccountKey;
    areFeesLoading: boolean;
    onSelectedFeeLevel: FeeOptionsListProps['onSelectedFeeLevel'];
    onCustomFeeSet: (customFeeParams: CustomFeeParams) => void;
    formDraft: FormState | null | undefined;
    networkType: NetworkType;
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
    networkType,
}: FeesContentProps) => (
    <VStack spacing="sp16">
        <VStack spacing="sp4">
            <Text variant="headline-sm">
                <FeeLabelTranslation networkType={networkType} />
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
