import { type ReactNode } from 'react';

import { type AccountKey, toTokenSymbol } from '@suite-common/wallet-types';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { type TxKeyPath } from '@suite-native/intl';
import { ReviewOutputItemValues } from '@suite-native/transaction-management';

export type YieldReviewListVariant = 'approval' | 'supply';

type YieldReviewListCommonProps = {
    accountKey: AccountKey;
    amount: string;
    fee: string;
    tokenSymbol: string;
};

type YieldApprovalReviewListProps = YieldReviewListCommonProps & {
    approvalLimit: string;
    variant: 'approval';
};

type YieldSupplyReviewListProps = YieldReviewListCommonProps & {
    receiveAmount?: string;
    receiveTokenSymbol?: string;
    variant: 'supply';
};

export type YieldReviewListProps = (YieldApprovalReviewListProps | YieldSupplyReviewListProps) & {
    isFooterVisible?: boolean;
    isSubmitDisabled?: boolean;
    isSubmitLoading?: boolean;
    onSubmit: () => void | Promise<void>;
};

export type YieldReviewCard = {
    content: ReactNode;
    key: string;
    title: string;
};

type DetailRowProps = {
    label: string;
    value: ReactNode;
};

type CreateYieldReviewCardsParams = YieldApprovalReviewListProps | YieldSupplyReviewListProps;

type Translate = (id: TxKeyPath) => string;

const cardTitleTranslationIds = {
    approval: 'earn.yieldReview.approvalCard.title',
    supply: 'earn.yieldReview.supplyCard.title',
} satisfies Record<YieldReviewListVariant, TxKeyPath>;

const detailsTitleTranslationIds = {
    approval: 'earn.yieldReview.approvalDetailsCard.title',
    supply: 'earn.yieldReview.transactionDetailsCard.title',
} satisfies Record<YieldReviewListVariant, TxKeyPath>;

const DetailRow = ({ label, value }: DetailRowProps) => (
    <HStack justifyContent="space-between" alignItems="center">
        <Text variant="body-sm">{label}</Text>
        {value}
    </HStack>
);

export const getYieldReviewCards = (
    { accountKey, amount, fee, tokenSymbol, ...variantProps }: CreateYieldReviewCardsParams,
    translate: Translate,
): YieldReviewCard[] => [
    {
        content: (
            <CryptoAmountFormatter
                value={amount}
                symbol={toTokenSymbol(tokenSymbol)}
                isDiscreetText={false}
            />
        ),
        key: 'amount',
        title: translate(cardTitleTranslationIds[variantProps.variant]),
    },
    ...(variantProps.variant === 'supply' &&
    variantProps.receiveAmount &&
    variantProps.receiveTokenSymbol
        ? [
              {
                  content: (
                      <CryptoAmountFormatter
                          value={variantProps.receiveAmount}
                          symbol={toTokenSymbol(variantProps.receiveTokenSymbol)}
                          isDiscreetText={false}
                      />
                  ),
                  key: 'receive-amount',
                  title: translate('earn.yieldReview.receiveCard.title'),
              },
          ]
        : []),
    {
        content: (
            <VStack spacing="sp16">
                <DetailRow
                    label={translate('transactionManagement.review.outputs.summary.amount')}
                    value={
                        <CryptoAmountFormatter
                            value={amount}
                            symbol={toTokenSymbol(tokenSymbol)}
                            isDiscreetText={false}
                        />
                    }
                />
                {variantProps.variant === 'approval' && (
                    <DetailRow
                        label={translate('earn.yieldReview.approvalDetailsCard.approvalLimit')}
                        value={
                            <Text variant="body-sm" color="contentSecondary">
                                {variantProps.approvalLimit}
                            </Text>
                        }
                    />
                )}
                <ReviewOutputItemValues
                    accountKey={accountKey}
                    value={fee}
                    translationKey="transactionManagement.review.outputs.summary.maxFee"
                />
            </VStack>
        ),
        key: 'details',
        title: translate(detailsTitleTranslationIds[variantProps.variant]),
    },
];
