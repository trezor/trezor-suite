import { type PropsWithChildren, useMemo } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectAreFeesLoading } from '@suite-common/wallet-core';
import {
    calculateTronFeeBreakdown,
    convertAmountSubunitsToUnits,
    formatNetworkAmount,
} from '@suite-common/wallet-utils';
import { Card, Column, InfoItem, SkeletonRectangle } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

import { CardanoSentTokenInfo } from './CardanoSentTokenInfo';
import { ReviewButton } from './ReviewButton';
import { TotalSentFeeContent } from './TotalSentFeeContent';

type ChildOrSkeletonProps = PropsWithChildren<{ isLoading?: boolean }>;

const ChildOrSkeleton = ({ children, isLoading }: ChildOrSkeletonProps) =>
    isLoading ? <SkeletonRectangle animate={true} /> : children;

const Container = styled.div`
    position: sticky;
    top: 80px;
`;

export const TotalSent = () => {
    const {
        account: { symbol, networkType, misc },
        composedLevels,
        getValues,
    } = useSendFormContext();
    const areFeesLoading = useSelector(state => selectAreFeesLoading(state, symbol));

    const selectedFee = getValues().selectedFee || 'normal';
    const transactionInfo = composedLevels ? composedLevels[selectedFee] : undefined;
    const isTokenTransfer = networkType === 'ethereum' && !!getValues('outputs.0.token');
    const hasTransactionInfo = transactionInfo !== undefined && transactionInfo.type !== 'error';
    const tokenInfo = hasTransactionInfo ? transactionInfo.token : undefined;
    const includingRent = networkType === 'solana';

    const tronResources = misc && 'tronResources' in misc ? misc.tronResources : undefined;
    const tronFees =
        networkType === 'tron'
            ? calculateTronFeeBreakdown(transactionInfo, tronResources, symbol)
            : null;

    const feeLabelId = useMemo(() => {
        if (isTokenTransfer) {
            return 'FEE';
        }

        if (includingRent) {
            return 'INCLUDING_FEE_AND_RENT';
        }

        return 'INCLUDING_FEE';
    }, [isTokenTransfer, includingRent]);

    return (
        <Container>
            <Card height="min-content" fillType="flat">
                <Column gap={4} margin={{ bottom: 24 }}>
                    <InfoItem
                        label={<Translation id="TOTAL_SENT" />}
                        direction="row"
                        verticalAlignment="start"
                        intent="neutral"
                        priority="primary"
                        typographyStyle="body-md"
                    >
                        <ChildOrSkeleton isLoading={areFeesLoading}>
                            <Column alignItems="flex-end">
                                <CardanoSentTokenInfo />
                                {hasTransactionInfo && (
                                    <FormattedCryptoAmount
                                        disableHiddenPlaceholder
                                        value={
                                            tokenInfo
                                                ? convertAmountSubunitsToUnits(
                                                      transactionInfo.totalSpent,
                                                      tokenInfo.decimals,
                                                  )
                                                : formatNetworkAmount(
                                                      transactionInfo.totalSpent,
                                                      symbol,
                                                  )
                                        }
                                        symbol={tokenInfo?.symbol ?? symbol}
                                        contractAddress={tokenInfo?.contract}
                                        data-testid="@wallet/send/total-sent"
                                    />
                                )}
                            </Column>
                        </ChildOrSkeleton>
                    </InfoItem>

                    <InfoItem
                        label={<Translation id={feeLabelId} />}
                        direction="row"
                        verticalAlignment="start"
                    >
                        <ChildOrSkeleton isLoading={areFeesLoading}>
                            {hasTransactionInfo && (
                                <TotalSentFeeContent
                                    transactionInfo={transactionInfo}
                                    networkType={networkType}
                                    networkSymbol={symbol}
                                    tokenInfo={tokenInfo}
                                    tronFees={tronFees}
                                />
                            )}
                        </ChildOrSkeleton>
                    </InfoItem>
                </Column>
                <ReviewButton />
            </Card>
        </Container>
    );
};
