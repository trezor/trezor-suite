import React, { useState, useEffect } from 'react';

import { spacings } from '@trezor/theme';
import { Row, Text } from '@trezor/components';
import { FeeLevel } from '@trezor/connect';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { formatDuration } from '@suite-common/suite-utils';
import { NetworkType } from '@suite-common/wallet-config';
import {
    PrecomposedTransaction,
    PrecomposedTransactionCardano,
    FeeInfo,
} from '@suite-common/wallet-types';

import { Translation } from 'src/components/suite/Translation';

type DetailsProps = {
    networkType: NetworkType;
    selectedLevel: FeeLevel;
    // fields below are validated as false-positives, eslint claims that they are not used...

    feeInfo: FeeInfo;

    transactionInfo?: PrecomposedTransaction | PrecomposedTransactionCardano;

    showFee: boolean;
};

type ItemProps = {
    label: React.ReactNode;
    children: React.ReactNode;
};

const Item = ({ label, children }: ItemProps) => (
    <Row gap={spacings.xxs}>
        <Text variant="tertiary">{label}:</Text>
        {children}
    </Row>
);

const BitcoinDetails = ({
    networkType,
    feeInfo,
    selectedLevel,
    transactionInfo,
    showFee,
}: DetailsProps) => {
    const hasInfo = transactionInfo && transactionInfo.type !== 'error';

    return (
        showFee && (
            <>
                <Item label={<Translation id="ESTIMATED_TIME" />}>
                    {formatDuration(feeInfo.blockTime * selectedLevel.blocks * 60)}
                </Item>

                <Item label={<Translation id="TR_FEE_RATE" />}>
                    {hasInfo ? transactionInfo.feePerByte : selectedLevel.feePerUnit}{' '}
                    {getFeeUnits(networkType)}
                    {hasInfo ? ` (${transactionInfo.bytes} B)` : ''}
                </Item>
            </>
        )
    );
};

const EthereumDetails = ({
    networkType,
    selectedLevel,
    transactionInfo,
    showFee,
}: DetailsProps) => {
    // States to remember the last known values of feeLimit and feePerByte when isComposedTx was true.
    const [lastKnownFeeLimit, setLastKnownFeeLimit] = useState('');
    const [lastKnownFeePerByte, setLastKnownFeePerByte] = useState('');

    const isComposedTx = transactionInfo && transactionInfo.type !== 'error';

    useEffect(() => {
        if (isComposedTx && transactionInfo.feeLimit) {
            setLastKnownFeeLimit(transactionInfo.feeLimit);
            setLastKnownFeePerByte(transactionInfo.feePerByte);
        }
    }, [isComposedTx, transactionInfo]);

    const gasLimit = isComposedTx
        ? transactionInfo.feeLimit
        : lastKnownFeeLimit || selectedLevel.feeLimit;
    const gasPrice = isComposedTx
        ? transactionInfo.feePerByte
        : lastKnownFeePerByte || selectedLevel.feePerUnit;

    return (
        showFee && (
            <>
                <Item label={<Translation id="TR_GAS_LIMIT" />}>{gasLimit}</Item>

                <Item label={<Translation id="TR_GAS_PRICE" />}>
                    {gasPrice} {getFeeUnits(networkType)}
                </Item>
            </>
        )
    );
};

const RippleDetails = ({ networkType, selectedLevel, showFee }: DetailsProps) =>
    showFee && <Item label={selectedLevel.feePerUnit}>{getFeeUnits(networkType)}</Item>;

export const FeeDetails = (props: DetailsProps) => {
    const { networkType } = props;

    return (
        <Text as="div" typographyStyle="hint">
            <Row gap={spacings.md}>
                {networkType === 'bitcoin' && <BitcoinDetails {...props} />}
                {networkType === 'ethereum' && <EthereumDetails {...props} />}
                {networkType === 'ripple' && <RippleDetails {...props} />}
            </Row>
        </Text>
    );
};
