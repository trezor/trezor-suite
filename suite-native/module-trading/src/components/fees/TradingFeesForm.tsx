import React from 'react';
import { useSelector } from 'react-redux';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import { Form } from '@suite-native/forms';
import { Translation } from '@suite-native/intl';
import {
    CustomFee,
    FeeOptionsList,
    FeesFooter,
    useFeesManagement,
} from '@suite-native/transaction-management';

import { selectTradingSendFormDraft } from '../../selectors/commonSelectors';
import { updateTradingSelectedFeeLevelThunk } from '../../thunks';

type TradingFeesFormProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const TradingFeesForm = ({ accountKey, tokenContract }: TradingFeesFormProps) => {
    const formDraft = useSelector(selectTradingSendFormDraft);

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
        formDraft,
        tokenContract,
        updateThunk: updateTradingSelectedFeeLevelThunk,
    });

    if (!account || !symbol) return null;

    return (
        <Form form={form}>
            {/*// BottomSheetModalProvider must be inside FormProvider to keep context available for sheets rendered via portal*/}
            <BottomSheetModalProvider>
                <VStack flex={1} justifyContent="space-between" spacing="sp24">
                    <VStack spacing="sp16">
                        <VStack spacing="sp4">
                            <Text variant="titleSmall">
                                <Translation id="moduleTrading.tradingFeesScreen.description.title" />
                            </Text>
                            <Text>
                                <Translation id="moduleTrading.tradingFeesScreen.description.body" />
                            </Text>
                        </VStack>
                        <VStack spacing="sp24">
                            {selectedFeeLevel !== 'custom' && (
                                <FeeOptionsList
                                    feeLevels={feeLevels}
                                    symbol={symbol}
                                    isLoading={areFeesLoading}
                                    onSelectedFeeLevel={handleFeeLevelChange}
                                />
                            )}
                            <CustomFee
                                symbol={symbol}
                                accountKey={accountKey}
                                onCustomFeeSet={handleCustomFeeSet}
                                formDraft={formDraft}
                            />
                        </VStack>
                    </VStack>
                    <FeesFooter
                        accountKey={accountKey}
                        isSubmittable={isSubmittable}
                        totalAmount={totalAmount}
                        fee={fee}
                        symbol={symbol}
                        tokenContract={tokenContract}
                        withSubmitButton={false}
                    />
                </VStack>
            </BottomSheetModalProvider>
        </Form>
    );
};
