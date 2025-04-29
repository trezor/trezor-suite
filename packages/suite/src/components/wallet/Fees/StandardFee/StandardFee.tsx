import { UseFormGetValues } from 'react-hook-form';

import styled from 'styled-components';

import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import {
    FeeInfo,
    FormState,
    PrecomposedTransaction,
    PrecomposedTransactionCardano,
} from '@suite-common/wallet-types';
import { FeeLevel } from '@trezor/connect';
import { spacingsPx } from '@trezor/theme';

import { BitcoinFeeCards } from './BitcoinFeeCards';
import { EthereumFeeCards } from './EthereumFeeCards';
import { FEE_CARD_MIN_WIDTH } from './FeeCard';
import { MiscFeeCards } from './MiscFeeCards';
import { FeeOptionType } from '../Fees';

export type StandardFeeProps = {
    networkType: NetworkType;
    symbol: NetworkSymbol;
    selectedLevel: FeeLevel;
    feeOptions: FeeOptionType[];
    feeInfo: FeeInfo;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    transactionInfo?: PrecomposedTransaction | PrecomposedTransactionCardano;
    isDirty: boolean;
    getValues: UseFormGetValues<FormState>;
};

export const FeeCardsWrapper = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(${FEE_CARD_MIN_WIDTH}px, 1fr));
    flex-wrap: wrap;
    gap: ${spacingsPx.sm};
    align-items: stretch;
`;

export const StandardFee = (props: StandardFeeProps) => {
    const { networkType } = props;

    switch (networkType) {
        case 'bitcoin':
            return <BitcoinFeeCards {...props} />;
        case 'ethereum':
            return <EthereumFeeCards {...props} />;
        default:
            return <MiscFeeCards {...props} />;
    }
};
