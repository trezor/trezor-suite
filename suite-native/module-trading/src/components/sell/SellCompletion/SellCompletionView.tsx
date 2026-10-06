import { type ReactNode, useState } from 'react';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import type { BankAccount, SellFiatTrade } from 'invity-api';

import { selectTradingSellFormStep } from '@suite-common/trading';
import { AnimatedVStack, BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { TradingPreviewInfoCard } from '../../general/TradingPreview/TradingPreviewInfoCard';
import { SellFromAccountCard } from '../SellFromAccountCard';
import { SellBankAccountPicker } from './BankAccount/SellBankAccountPicker';
import { SellCompletionFeeInfo } from './SellCompletionFeeInfo';

export type SellCompletionViewProps = {
    quote: SellFiatTrade;
    txnErrorString: ReactNode;
    shouldShowFee: boolean;
};

export const SellCompletionView = ({
    quote,
    txnErrorString,
    shouldShowFee,
}: SellCompletionViewProps) => {
    const formStep = useSelector(selectTradingSellFormStep);
    const [selectedBankAccountIban, setSelectedBankAccountIban] = useState<string>();

    const [firstBankAccount] = quote.bankAccounts ?? [];
    const isSelectedBankAccountAvailable =
        quote.bankAccounts?.some(
            bankAccount => bankAccount.bankAccount === selectedBankAccountIban,
        ) ?? false;
    const displayedBankAccountIban = isSelectedBankAccountAvailable
        ? selectedBankAccountIban
        : firstBankAccount?.bankAccount;
    const isTxnError = !!txnErrorString;
    const isBankAccountPickerVisible = formStep === 'BANK_ACCOUNT' && !!displayedBankAccountIban;

    const handleBankAccountSelect = (bankAccount: BankAccount) => {
        setSelectedBankAccountIban(bankAccount.bankAccount);
    };

    return (
        <AnimatedVStack spacing="sp16" layout={LinearTransition}>
            {isTxnError && (
                <Animated.View>
                    <BannerInline intent="critical" title={txnErrorString} />
                </Animated.View>
            )}
            <SellFromAccountCard quote={quote} />
            <TradingPreviewInfoCard
                quote={quote}
                tradingType="sell"
                fiatAmountLabel={<Translation id="moduleTrading.tradingSellPreviewScreen.youGet" />}
                feeRow={
                    shouldShowFee ? (
                        <SellCompletionFeeInfo quote={quote} isTxnError={isTxnError} />
                    ) : undefined
                }
            />
            {isBankAccountPickerVisible && (
                <SellBankAccountPicker
                    orderId={quote.orderId}
                    selectedBankAccountIban={displayedBankAccountIban}
                    onBankAccountSelect={handleBankAccountSelect}
                />
            )}
        </AnimatedVStack>
    );
};
