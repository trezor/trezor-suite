import React, { useEffect, useRef } from 'react';

import styled from 'styled-components';

import { formatDurationStrict } from '@suite-common/suite-utils';
import { NetworkSymbol, NetworkType, getNetwork } from '@suite-common/wallet-config';
import {
    FeeInfo,
    PrecomposedTransaction,
    PrecomposedTransactionCardano,
} from '@suite-common/wallet-types';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { Box, Column, ElevationUp, RadioCard, Row, Text } from '@trezor/components';
import { FeeLevel } from '@trezor/connect';
import { FeeRate } from '@trezor/product-components';
import { spacings, spacingsPx } from '@trezor/theme';

import { FiatValue } from 'src/components/suite/FiatValue';
import { useLocales } from 'src/hooks/suite';

import { FeeOption } from './Fees';

type DetailsProps = {
    networkType: NetworkType;
    symbol: NetworkSymbol;
    selectedLevel: FeeLevel;
    // fields below are validated as false-positives, eslint claims that they are not used...
    feeOptions: FeeOption[];
    feeInfo: FeeInfo;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    transactionInfo?: PrecomposedTransaction | PrecomposedTransactionCardano;

    showFee: boolean;
};

export const FeeCardsWrapper = styled.div<{ $columns: number }>`
    width: 100%;
    display: grid;
    grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
    gap: ${spacingsPx.sm};
    align-items: stretch;
`;

type FeeCardProps = {
    value: FeeLevel['label'];
    isSelected: boolean;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    topLeftChild: React.ReactNode;
    topRightChild: React.ReactNode;
    bottomLeftChild: React.ReactNode;
    bottomRightChild: React.ReactNode;
};

const FEE_CARD_MIN_WIDTH = 220;

type ResizeObserverType = (
    feeOptions: FeeOption[],
    setColumns: (columns: number) => void,
) => ResizeObserver;

const resizeObserver: ResizeObserverType = (feeOptions, setColumns) =>
    new ResizeObserver(entries => {
        const borderBoxSize = entries[0].borderBoxSize?.[0];
        if (!borderBoxSize) {
            return;
        }

        const { inlineSize: elementWidth } = borderBoxSize;

        const minWidth = (FEE_CARD_MIN_WIDTH + spacings.xs) * feeOptions.length;

        const columns = elementWidth > minWidth ? feeOptions.length : 1;

        setColumns(columns);
    });

const FeeCard = ({
    value,
    isSelected,
    changeFeeLevel,
    topLeftChild,
    topRightChild,
    bottomLeftChild,
    bottomRightChild,
}: FeeCardProps) => (
    <Box minWidth={FEE_CARD_MIN_WIDTH}>
        <ElevationUp>
            <RadioCard onClick={() => changeFeeLevel(value)} isActive={isSelected}>
                <Column>
                    <Row justifyContent="space-between">
                        <Text typographyStyle="highlight">{topLeftChild}</Text>
                        <Text variant="tertiary" typographyStyle="hint">
                            {topRightChild}
                        </Text>
                    </Row>
                    <Row justifyContent="space-between" height={24}>
                        <Text>{bottomLeftChild}</Text>
                        <Text variant="tertiary" typographyStyle="hint">
                            {bottomRightChild}
                        </Text>
                    </Row>
                </Column>
            </RadioCard>
        </ElevationUp>
    </Box>
);

const BitcoinDetails = ({
    networkType,
    feeInfo,
    transactionInfo,
    feeOptions,
    showFee,
    selectedLevel,
    changeFeeLevel,
    symbol,
}: DetailsProps) => {
    const [columns, setColumns] = React.useState(1);
    const locale = useLocales();

    const hasInfo = transactionInfo && transactionInfo.type !== 'error';
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        resizeObserver(feeOptions, setColumns).observe(ref.current);

        return () => resizeObserver(feeOptions, setColumns).disconnect();
    }, [feeOptions, setColumns]);

    return (
        showFee && (
            <FeeCardsWrapper ref={ref} $columns={columns}>
                {feeOptions?.map((fee, index) => (
                    <FeeCard
                        key={index}
                        value={fee.value}
                        isSelected={selectedLevel.label === fee.value}
                        changeFeeLevel={changeFeeLevel}
                        topLeftChild={
                            <span data-testid={`@fee-card/${fee.value}`}>{fee.label}</span>
                        }
                        topRightChild={
                            <>
                                ~
                                {formatDurationStrict(
                                    feeInfo.blockTime * (fee?.blocks ?? 0) * 60,
                                    locale,
                                )}
                            </>
                        }
                        bottomLeftChild={
                            <FiatValue
                                disableHiddenPlaceholder
                                amount={fee?.networkAmount ?? ''}
                                symbol={symbol}
                                showApproximationIndicator
                            />
                        }
                        bottomRightChild={
                            <>
                                <FeeRate
                                    feeRate={
                                        hasInfo
                                            ? transactionInfo.feePerByte
                                            : selectedLevel.feePerUnit
                                    }
                                    networkType={networkType}
                                />
                                {hasInfo ? ` (${transactionInfo.bytes} B)` : ''}
                            </>
                        }
                    />
                ))}
            </FeeCardsWrapper>
        )
    );
};

const EthereumDetails = ({
    showFee,
    feeOptions,
    selectedLevel,
    changeFeeLevel,
    symbol,
    networkType,
}: DetailsProps) => {
    const hasSettlementLayer = !!getNetwork(symbol).settlementLayer;

    // TODO: this can be probably moved to FeeRate component
    const formatFeePerUnit = (feePerUnit?: string) => {
        const num = Number(feePerUnit) || 0;

        const numOfDecimalPlaces = hasSettlementLayer ? 4 : 2;

        const multiplier = Math.pow(10, numOfDecimalPlaces);

        return (Math.ceil(num * multiplier) / multiplier).toFixed(numOfDecimalPlaces);
    };

    return (
        showFee && (
            <Column width="100%">
                <FeeCardsWrapper $columns={1}>
                    {feeOptions?.map((fee, index) => (
                        <FeeCard
                            key={index}
                            value={fee.value}
                            isSelected={selectedLevel.label === fee.value}
                            changeFeeLevel={changeFeeLevel}
                            topLeftChild={
                                <span data-testid={`@fee-card/${fee.value}`}>{fee.label}</span>
                            }
                            topRightChild=""
                            bottomLeftChild={
                                <FiatValue
                                    disableHiddenPlaceholder
                                    amount={fee.networkAmount || ''}
                                    symbol={symbol}
                                    showApproximationIndicator
                                />
                            }
                            bottomRightChild={
                                <FeeRate
                                    feeRate={formatFeePerUnit(fee?.feePerUnit)}
                                    networkType={networkType}
                                />
                            }
                        />
                    ))}
                </FeeCardsWrapper>
            </Column>
        )
    );
};

// Solana, Ripple, Cardano and other networks with only one option
const MiscDetails = ({
    networkType,
    showFee,
    feeOptions,
    symbol,
    changeFeeLevel,
}: DetailsProps) => {
    if (!feeOptions?.length) return null;

    const feeOption = feeOptions[0]; // in the future Solana should have it's own Details component
    const feeAmount = networkType === 'solana' ? feeOption.feePerTx : feeOption.feePerUnit;

    return (
        showFee && (
            <Column padding={spacings.xxxs} width="100%">
                <FeeCard
                    value={feeOption.value}
                    isSelected={true}
                    changeFeeLevel={changeFeeLevel}
                    topLeftChild={
                        <span data-testid={`@fee-card/${feeOption.value}`}>{feeOption.label}</span>
                    }
                    topRightChild=""
                    bottomLeftChild={
                        <FiatValue
                            disableHiddenPlaceholder
                            amount={feeOption.networkAmount || ''}
                            symbol={symbol}
                            showApproximationIndicator
                        />
                    }
                    bottomRightChild={
                        <Text variant="tertiary">
                            {feeAmount} {getFeeUnits(networkType)}
                        </Text>
                    }
                />
            </Column>
        )
    );
};

export const FeeDetails = (props: DetailsProps) => {
    const { networkType } = props;

    const detailsComponentMap: Partial<Record<NetworkType, React.FC<DetailsProps>>> = {
        bitcoin: BitcoinDetails,
        ethereum: EthereumDetails,
    };

    const DetailsComponent = detailsComponentMap[networkType] ?? MiscDetails;

    return (
        <Text data-testid="@wallet/fee-details" as="div">
            <Row gap={spacings.md} justifyContent="space-evenly">
                <DetailsComponent {...props} />
            </Row>
        </Text>
    );
};
