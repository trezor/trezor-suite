import React from 'react';
import { useSelector } from 'react-redux';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

import type { FormDraftRootState } from '@suite-common/wallet-core';
import { selectDeepCopyOfFormDraft } from '@suite-common/wallet-core';
import type { AccountKey, FormDraftKeyPrefix, TokenAddress } from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import type { TradingStackParamList, TradingStackRoutes } from '@suite-native/navigation';
import type { NativeSupportedFeeLevel } from '@suite-native/transaction-management';
import { FeesContent, FeesFooter, useFeesManagement } from '@suite-native/transaction-management';

import { updateTradingSelectedFeeLevelThunk } from '../../thunks';

type TradingFeesFormProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const TradingFeesForm = ({ accountKey, tokenContract }: TradingFeesFormProps) => {
    const { tradingType = 'buy' } =
        useRoute<RouteProp<TradingStackParamList, TradingStackRoutes.TradingFees>>().params;

    const formDraftPrefix = `trading-${tradingType}` as FormDraftKeyPrefix;
    const formDraftKey = getFormDraftKey(formDraftPrefix, '');

    const formDraft = useSelector((state: FormDraftRootState) =>
        selectDeepCopyOfFormDraft(state, formDraftKey),
    );

    const {
        form,
        selectedFeeLevel,
        totalAmount,
        fee,
        isSubmittable,
        areFeesLoading,
        symbol,
        account,
        feeLevels,
        handleFeeLevelChange,
        handleCustomFeeSet,
    } = useFeesManagement({
        accountKey,
        tokenContract,
        updateThunk: updateTradingSelectedFeeLevelThunk,
        selectedFee: formDraft?.selectedFee as NativeSupportedFeeLevel,
        selectedFeePerUnit: formDraft?.feePerUnit,
        selectedSetMaxOutputId: formDraft?.setMaxOutputId,
        formDraftKey,
    });

    if (!account || !symbol) return null;

    return (
        <Form form={form}>
            {/*// BottomSheetModalProvider must be inside FormProvider to keep context available for sheets rendered via portal*/}
            <BottomSheetModalProvider>
                <VStack flex={1} justifyContent="space-between" spacing="sp24">
                    <FeesContent
                        selectedFeeLevel={selectedFeeLevel}
                        feeLevels={feeLevels}
                        symbol={symbol}
                        accountKey={accountKey}
                        areFeesLoading={areFeesLoading}
                        onSelectedFeeLevel={handleFeeLevelChange}
                        onCustomFeeSet={handleCustomFeeSet}
                        formDraft={formDraft}
                    />
                    {!!totalAmount && !!fee && (
                        <FeesFooter
                            accountKey={accountKey}
                            isSubmittable={isSubmittable}
                            totalAmount={totalAmount}
                            fee={fee}
                            symbol={symbol}
                            tokenContract={tokenContract}
                            withSubmitButton={false}
                        />
                    )}
                </VStack>
            </BottomSheetModalProvider>
        </Form>
    );
};
