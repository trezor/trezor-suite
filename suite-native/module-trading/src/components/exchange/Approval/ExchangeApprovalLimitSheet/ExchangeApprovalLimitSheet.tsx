import { memo, useEffect } from 'react';

import type { DexApprovalType, ExchangeTrade } from 'invity-api';

import { cryptoIdToNetworkSymbolAndContractAddress } from '@suite-common/trading';
import { BottomSheetModal, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ExchangeApprovalLimitCard } from './ExchangeApprovalLimitCard';
import { TradingCoinAmountFormatter } from '../../../general/TradingCoinAmountFormatter';
import { LimitPickerUnlimitedAlert } from '../LimitPickerUnlimitedAlert';

export type ExchangeApprovalLimitSheetProps = {
    isVisible: boolean;
    onDismiss: () => void;
    onApprovalTypeSelect: (type: DexApprovalType) => void;
    selectedApprovalType: DexApprovalType;
    quote: ExchangeTrade;
};

export const ExchangeApprovalLimitSheet = memo(
    ({
        isVisible,
        onDismiss,
        onApprovalTypeSelect,
        selectedApprovalType,
        quote,
    }: ExchangeApprovalLimitSheetProps) => {
        const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

        useEffect(
            () => (isVisible ? openModal() : closeModal()),
            [isVisible, openModal, closeModal],
        );

        const { symbol, contractAddress } = quote.send
            ? cryptoIdToNetworkSymbolAndContractAddress(quote.send)
            : {};

        if (!symbol) {
            return null;
        }

        return (
            <BottomSheetModal
                ref={bottomSheetRef}
                onDismiss={onDismiss}
                title={<Translation id="moduleTrading.exchangeApprovalLimitSheet.title" />}
                testID="ExchangeApproval/LimitSheet"
                isCloseDisplayed
            >
                <VStack spacing="sp12" paddingBottom="sp12">
                    <ExchangeApprovalLimitCard
                        title={
                            <TradingCoinAmountFormatter
                                cryptoId={quote.send}
                                amount={quote.sendStringAmount}
                                variant="body-sm-strong"
                                color="contentPrimary"
                            />
                        }
                        description={
                            <Translation id="moduleTrading.exchangeApprovalLimitSheet.limitedCard.info" />
                        }
                        symbol={symbol}
                        contractAddress={contractAddress}
                        isChecked={selectedApprovalType === 'MINIMAL'}
                        onChange={() => onApprovalTypeSelect('MINIMAL')}
                    />
                    <ExchangeApprovalLimitCard
                        title={
                            <Text variant="body-sm-strong" color="contentPrimary">
                                <Translation id="moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel" />
                            </Text>
                        }
                        description={
                            <Translation id="moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.info" />
                        }
                        symbol={symbol}
                        contractAddress={contractAddress}
                        isChecked={selectedApprovalType === 'INFINITE'}
                        onChange={() => onApprovalTypeSelect('INFINITE')}
                    >
                        <LimitPickerUnlimitedAlert cryptoId={quote.send} />
                    </ExchangeApprovalLimitCard>
                </VStack>
            </BottomSheetModal>
        );
    },
);
