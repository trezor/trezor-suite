import { useRef } from 'react';

import type { BottomSheetModalMethods } from '@gorhom/bottom-sheet/lib/typescript/types';

import { AccountKey, FeeLevelLabel, FormState, TokenAddress } from '@suite-common/wallet-types';
import { Card, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';

import { FeesBottomSheet } from './FeesBottomSheet';
import { getFeeLabelTranslationId } from './feesLabelUtils';
import { useFeesManagement } from '../../hooks';
import { UpdateSelectedFeeLevelThunkParams } from '../../types';

type FeeSummaryCardProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    updateThunk: (params: UpdateSelectedFeeLevelThunkParams) => any;
    formDraft: FormState | null | undefined;
    formDraftKey?: string;
    testID?: string;
};

export const FeeSummaryCard = ({
    accountKey,
    tokenContract,
    updateThunk,
    formDraft,
    formDraftKey,
    testID,
}: FeeSummaryCardProps) => {
    const { translate } = useTranslate();
    const bottomSheetRef = useRef<BottomSheetModalMethods | null>(null);

    const {
        form,
        fee,
        areFeesLoading,
        symbol,
        account,
        selectedFeeLevel,
        feeLevels,
        handleFeeLevelChange,
    } = useFeesManagement({
        accountKey,
        tokenContract,
        updateThunk,
        selectedFee: formDraft?.selectedFee as FeeLevelLabel,
        selectedFeePerUnit: formDraft?.feePerUnit,
        selectedSetMaxOutputId: formDraft?.setMaxOutputId,
        formDraftKey,
    });

    if (!account || !symbol || !fee) return null;

    const { networkType } = account;
    const labelKey = getFeeLabelTranslationId(networkType);

    return (
        <>
            <PressableOpacity onPress={() => bottomSheetRef.current?.present()} testID={testID}>
                <Card>
                    <HStack justifyContent="space-between" alignItems="center">
                        <VStack spacing="sp4">
                            <Text variant="body-sm-strong">{translate(labelKey)}</Text>
                        </VStack>
                        <HStack alignItems="center" spacing="sp8">
                            <VStack alignItems="flex-end" spacing="sp2">
                                <CryptoAmountFormatter
                                    variant="body-sm-strong"
                                    color="textDefault"
                                    value={fee}
                                    symbol={symbol}
                                    isBalance={false}
                                    isLoading={areFeesLoading}
                                />
                                <CryptoToFiatAmountFormatter
                                    variant="body-xs"
                                    color="textSubdued"
                                    value={fee}
                                    symbol={symbol}
                                    isLoading={areFeesLoading}
                                />
                            </VStack>
                            <Icon name="caretDown" size="medium" color="iconSubdued" />
                        </HStack>
                    </HStack>
                </Card>
            </PressableOpacity>

            <FeesBottomSheet
                bottomSheetRef={bottomSheetRef}
                networkType={networkType}
                symbol={symbol}
                feeLevels={feeLevels}
                selectedFeeLevel={selectedFeeLevel}
                areFeesLoading={areFeesLoading}
                accountKey={accountKey}
                formDraft={formDraft}
                form={form}
                onFeeLevelChange={handleFeeLevelChange}
            />
        </>
    );
};
