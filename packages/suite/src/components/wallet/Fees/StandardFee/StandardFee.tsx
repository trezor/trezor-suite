import { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import {
    FeeInfo,
    PrecomposedTransaction,
    PrecomposedTransactionCardano,
} from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { FeeLevel } from '@trezor/connect';
import { spacings, spacingsPx } from '@trezor/theme';

import { BitcoinFeeCards } from './BitcoinFeeCards';
import { EthereumFeeCards } from './EthereumFeeCards';
import { FEE_CARD_MIN_WIDTH } from './FeeCard';
import { MiscFeeCards } from './MiscFeeCards';
import { FeeOptionType } from '../Fees';

export type StandardFeeProps = {
    networkType: NetworkType;
    symbol: NetworkSymbol;
    selectedLevel: FeeLevel;
    // fields below are validated as false-positives, eslint claims that they are not used...
    feeOptions: FeeOptionType[];
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

type ResizeObserverType = (
    feeOptions: FeeOptionType[],
    setColumns: (columns: number) => void,
) => ResizeObserver;

export const resizeObserver: ResizeObserverType = (feeOptions, setColumns) =>
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

export const StandardFee = (props: StandardFeeProps) => {
    const { networkType, feeOptions } = props;

    const [columns, setColumns] = useState(1);

    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        const observer = resizeObserver(feeOptions, setColumns);
        observer.observe(ref.current);

        return () => observer.disconnect();
    }, [feeOptions, setColumns]);

    const feeCardsComponentMap: Partial<Record<NetworkType, React.FC<StandardFeeProps>>> = {
        bitcoin: BitcoinFeeCards,
        ethereum: EthereumFeeCards,
    };

    const FeeCardsComponent = feeCardsComponentMap[networkType] ?? MiscFeeCards;

    return (
        <Row gap={spacings.md} justifyContent="space-evenly" data-testid="@wallet/fee-details">
            <FeeCardsWrapper $columns={columns} ref={ref}>
                <FeeCardsComponent {...props} />
            </FeeCardsWrapper>
        </Row>
    );
};
