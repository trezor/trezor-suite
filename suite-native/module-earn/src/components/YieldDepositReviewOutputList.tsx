import { type ReactNode } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import { useSelector } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectSendFormReviewButtonRequestsCount } from '@suite-common/wallet-core';
import {
    type AccountKey,
    type ReviewOutputState,
    type TokenSymbol,
} from '@suite-common/wallet-types';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { useTranslate } from '@suite-native/intl';
import {
    LIST_VERTICAL_SPACING,
    ReviewOutputCard,
    ReviewOutputItemValues,
    SlidingFooterOverlay,
    useActiveStepOffset,
} from '@suite-native/transaction-management';

type YieldDepositReviewOutputListProps = {
    accountKey: AccountKey;
    amount: string;
    fee: string;
    isSigned: boolean;
    networkSymbol: NetworkSymbol;
    receiveAmount: string;
    receiveTokenSymbol: TokenSymbol;
    tokenSymbol: TokenSymbol;
};

type YieldDepositReviewCard = {
    content: ReactNode;
    key: string;
    title: string;
};

type YieldDepositReviewCardProps = {
    card: YieldDepositReviewCard;
    onLayout: (event: LayoutChangeEvent) => void;
    outputState: ReviewOutputState;
};

const YieldDepositReviewCard = ({ card, onLayout, outputState }: YieldDepositReviewCardProps) => (
    <View onLayout={onLayout}>
        <ReviewOutputCard title={card.title} outputState={outputState}>
            {card.content}
        </ReviewOutputCard>
    </View>
);

export const YieldDepositReviewOutputList = ({
    accountKey,
    amount,
    fee,
    isSigned,
    networkSymbol,
    receiveAmount,
    receiveTokenSymbol,
    tokenSymbol,
}: YieldDepositReviewOutputListProps) => {
    const { translate } = useTranslate();
    const buttonRequestsCount = useSelector((state: DeviceRootState) =>
        selectSendFormReviewButtonRequestsCount(state, networkSymbol),
    );
    const amountValue = (
        <CryptoAmountFormatter value={amount} symbol={tokenSymbol} isDiscreetText={false} />
    );
    const cards: YieldDepositReviewCard[] = [
        {
            content: amountValue,
            key: 'deposit',
            title: translate('earn.yieldReview.depositCard.title'),
        },
        {
            content: (
                <CryptoAmountFormatter
                    value={receiveAmount}
                    symbol={receiveTokenSymbol}
                    isDiscreetText={false}
                />
            ),
            key: 'receive',
            title: translate('earn.yieldReview.receiveCard.title'),
        },
        {
            content: (
                <VStack spacing="sp16">
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text variant="body-sm">
                            {translate('transactionManagement.review.outputs.summary.amount')}
                        </Text>
                        {amountValue}
                    </HStack>
                    <ReviewOutputItemValues
                        accountKey={accountKey}
                        value={fee}
                        translationKey="transactionManagement.review.outputs.summary.maxFee"
                    />
                </VStack>
            ),
            key: 'details',
            title: translate('earn.yieldReview.transactionDetailsCard.title'),
        },
    ];
    const activeCardIndex = Math.min(buttonRequestsCount - 1, cards.length - 1);
    const activeStep = Math.max(activeCardIndex, 0);
    const { activeStepBottomOffset, handleReadListItemHeight } = useActiveStepOffset(activeStep);

    const getOutputState = (index: number): ReviewOutputState => {
        if (isSigned) {
            return 'success';
        }

        if (activeCardIndex < 0) {
            return undefined;
        }

        if (index < activeCardIndex) {
            return 'success';
        }

        if (index === activeCardIndex) {
            return 'active';
        }

        return undefined;
    };

    return (
        <>
            <VStack spacing={LIST_VERTICAL_SPACING}>
                {cards.map((card, index) => (
                    <YieldDepositReviewCard
                        key={card.key}
                        card={card}
                        onLayout={event => handleReadListItemHeight(event, index)}
                        outputState={getOutputState(index)}
                    />
                ))}
            </VStack>
            {!isSigned && <SlidingFooterOverlay activeStepOffset={activeStepBottomOffset} />}
        </>
    );
};
