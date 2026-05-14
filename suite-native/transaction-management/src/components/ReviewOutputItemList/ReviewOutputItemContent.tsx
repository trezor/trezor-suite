import {
    type AccountKey,
    type FormStateTradingCryptoCurrency,
    type FormStateTradingFiatCurrency,
    type ReviewOutputType,
    type TokenAddress,
    type TokenSymbol,
} from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits, isMaxAllowance } from '@suite-common/wallet-utils';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { AddressFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { type ExchangeFlowType } from '@suite-native/navigation';
import type { TokenInfo } from '@trezor/connect';

import { ReviewOutputHexData } from './ReviewOutputHexData';
import { ReviewOutputItemValues } from './ReviewOutputItemValues';

export type ReviewOutputItemContentProps = {
    accountKey: AccountKey;
    outputType: ReviewOutputType;
    value: string;
    value2?: string;
    token?: TokenInfo;
    tokenContract?: TokenAddress;
    flowType?: ExchangeFlowType;
    send?: FormStateTradingCryptoCurrency;
    receive?: FormStateTradingCryptoCurrency | FormStateTradingFiatCurrency;
};

export const ReviewOutputItemContent = ({
    accountKey,
    outputType,
    value,
    value2,
    token,
    tokenContract,
    flowType,
    send,
    receive,
}: ReviewOutputItemContentProps) => {
    switch (outputType) {
        case 'amount':
            return (
                <ReviewOutputItemValues
                    accountKey={accountKey}
                    value={value}
                    translationKey="transactionManagement.review.outputs.amountLabel"
                    tokenContract={tokenContract}
                />
            );

        case 'destination-tag':
            return (
                <Text variant="body-sm">
                    {value || (
                        <Translation id="transactionManagement.review.outputs.destinationTagNotSet" />
                    )}
                </Text>
            );

        case 'address':
        case 'regular_legacy':
            if (flowType === 'approve' || flowType === 'swap') {
                return (
                    <Text variant="body-sm">
                        <Translation id="transactionManagement.review.outputs.tokenApprovalDescription" />
                    </Text>
                );
            }
            if (flowType === 'revoke' || flowType === 'revoke-and-approve') {
                return (
                    <Text variant="body-sm">
                        <Translation id="transactionManagement.review.outputs.tokenRevocationDescription" />
                    </Text>
                );
            }

            return <AddressFormatter value={value} format="full" variant="body-sm" />;

        case 'contract':
            if (
                flowType === 'approve' ||
                flowType === 'revoke' ||
                flowType === 'revoke-and-approve'
            ) {
                return <Text variant="body-sm">{value}</Text>;
            }

            return <AddressFormatter value={value} format="full" variant="body-sm" />;

        case 'signing-with':
            return <AddressFormatter value={value} format="full" variant="body-sm" />;

        case 'timebounds':
            return (
                <Text variant="body-sm">
                    <Translation id="transactionManagement.review.outputs.timeboundsNotSet" />
                </Text>
            );

        case 'network':
            return (
                <Text variant="body-sm">
                    <Translation id="transactionManagement.review.outputs.networkTestnet" />
                </Text>
            );

        case 'approve_data': {
            const isApproveDataExchangeFlow =
                flowType === 'approve' ||
                flowType === 'revoke' ||
                flowType === 'revoke-and-approve';

            const isApprovalTx = flowType === 'approve';
            const isMaxApproval = isMaxAllowance(value);

            const getPrimaryValue = () => {
                if (!isApprovalTx && token?.symbol) {
                    return <Text variant="body-sm">{token.symbol}</Text>;
                }

                if (!isApprovalTx) {
                    return (
                        <Text variant="body-sm">
                            {isMaxApproval ? (
                                <Translation id="transactionManagement.review.outputs.approveMaxAmount" />
                            ) : (
                                value
                            )}
                        </Text>
                    );
                }

                if (isMaxApproval) {
                    return (
                        <Text variant="body-sm">
                            <Translation id="transactionManagement.review.outputs.approveMaxAmount" />
                        </Text>
                    );
                }

                if (!token) {
                    return <Text variant="body-sm">{value}</Text>;
                }

                return (
                    <CryptoAmountFormatter
                        variant="body-sm"
                        color="contentPrimary"
                        textAlign="right"
                        value={convertAmountSubunitsToUnits(value, token.decimals)}
                        symbol={token.symbol as TokenSymbol}
                        decimals={token.decimals}
                        isDiscreetText={false}
                    />
                );
            };

            if (!isApproveDataExchangeFlow) {
                console.warn(
                    `ReviewOutputItemContent: Unsupported output type "${outputType}" with value "${value}".`,
                );

                return null;
            }

            return (
                <VStack>
                    <HStack justifyContent="space-between">
                        <Text variant="body-sm">
                            <Translation
                                id={
                                    isApprovalTx
                                        ? 'transactionManagement.review.outputs.amountAllowanceLabel'
                                        : 'transactionManagement.review.outputs.tokenLabel'
                                }
                            />
                        </Text>
                        <Box flexShrink={1} alignItems="flex-end">
                            {getPrimaryValue()}
                        </Box>
                    </HStack>
                    {!!value2 && (
                        <HStack justifyContent="space-between">
                            <Text variant="body-sm">
                                <Translation id="transactionManagement.review.outputs.chainLabel" />
                            </Text>
                            <Text variant="body-sm">{value2}</Text>
                        </HStack>
                    )}
                </VStack>
            );
        }

        case 'data':
            return <ReviewOutputHexData value={value} />;

        case 'recipient_name':
            return (
                <Text variant="body-sm" selectable>
                    {value}
                </Text>
            );

        case 'traded_assets': {
            if (!send || !receive) {
                return null;
            }

            const receiveDisplay =
                'fiatCurrency' in receive
                    ? `${receive.amount} ${receive.fiatCurrency}`
                    : `${receive.amount} ${receive.symbol}`;

            return (
                <VStack spacing="sp12">
                    <Text variant="body-sm">
                        <Translation id="transactionManagement.review.outputs.tradedAssetsSendLabel" />
                        {` ${send.amount} ${send.symbol}`}
                    </Text>
                    <Text variant="body-sm">
                        <Translation id="transactionManagement.review.outputs.tradedAssetsReceiveLabel" />
                        {` ${receiveDisplay}`}
                    </Text>
                </VStack>
            );
        }

        case 'note':
            return <Text variant="body-sm">{value}</Text>;

        case 'fee-limit':
            return (
                <HStack>
                    <Box flex={0.4} justifyContent="center">
                        <Text variant="body-sm">
                            <Translation id="transactionManagement.review.outputs.feeLimitLabel" />
                        </Text>
                    </Box>
                    <Box flex={0.6} alignItems="flex-end">
                        <Text variant="body-sm">{Number(value).toLocaleString()} SUN</Text>
                    </Box>
                </HStack>
            );

        default:
            // TODO: handle other output types when are other coins supported (ETH feeGas etc.)
            console.warn(
                `ReviewOutputItemContent: Unsupported output type "${outputType}" with value "${value}".`,
            );

            return null;
    }
};
