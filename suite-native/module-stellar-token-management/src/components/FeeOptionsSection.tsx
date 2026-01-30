import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountKey,
    FeeLevelLabel,
    FormState,
    GeneralPrecomposedLevels,
} from '@suite-common/wallet-types';
import { CustomFeeParams, FeesContent } from '@suite-native/transaction-management';

type FeeOptionsSectionProps = {
    accountKey: AccountKey;
    feeLevels: GeneralPrecomposedLevels;
    symbol: NetworkSymbol;
    areFeesLoading: boolean;
    selectedFeeLevel: FeeLevelLabel;
    onSelectedFeeLevel: (feeLevel: FeeLevelLabel) => void;
    onCustomFeeSet: (customFeeParams: CustomFeeParams) => void;
    formDraft: FormState | undefined;
};

export const FeeOptionsSection = ({
    accountKey,
    feeLevels,
    symbol,
    areFeesLoading,
    selectedFeeLevel,
    onSelectedFeeLevel,
    onCustomFeeSet,
    formDraft,
}: FeeOptionsSectionProps) => (
    <FeesContent
        accountKey={accountKey}
        feeLevels={feeLevels}
        symbol={symbol}
        areFeesLoading={areFeesLoading}
        selectedFeeLevel={selectedFeeLevel}
        onSelectedFeeLevel={onSelectedFeeLevel}
        onCustomFeeSet={onCustomFeeSet}
        formDraft={formDraft}
        networkType="stellar"
    />
);
