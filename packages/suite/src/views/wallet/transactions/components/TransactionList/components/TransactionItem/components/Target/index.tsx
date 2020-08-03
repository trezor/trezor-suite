import React from 'react';
import styled from 'styled-components';
import { HiddenPlaceholder, FiatValue, Translation } from '@suite-components';
import { ArrayElement } from '@suite/types/utils';
import { getTxOperation, getTargetAmount } from '@wallet-utils/transactionUtils';
import { isTestnet } from '@wallet-utils/accountUtils';
import { WalletAccountTransaction } from '@wallet-types';
import Sign from '@suite-components/Sign';
import TokenTransferAddressLabel from '../TokenTransferAddressLabel';
import TargetAddressLabel from '../TargetAddressLabel';
import BaseTargetLayout from '../BaseTargetLayout';

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
    /* padding: 8px 0px; row padding */
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

interface TokenTransferProps {
    transfer: ArrayElement<WalletAccountTransaction['tokens']>;
    transaction: WalletAccountTransaction;
    singleRowLayout?: boolean;
    useAnimation?: boolean;
}

export const TokenTransfer = ({
    transfer,
    transaction,
    useAnimation,
    singleRowLayout,
}: TokenTransferProps) => {
    const operation = getTxOperation(transaction);
    return (
        <BaseTargetLayout
            useAnimation={useAnimation}
            addressLabel={<TokenTransferAddressLabel transfer={transfer} type={transaction.type} />}
            singleRowLayout={singleRowLayout}
            amount={
                !singleRowLayout && (
                    <StyledHiddenPlaceholder>
                        {operation && <Sign value={operation} />}
                        {transfer.amount} {transfer.symbol}
                    </StyledHiddenPlaceholder>
                )
            }
        />
    );
};

interface TargetProps {
    target: ArrayElement<WalletAccountTransaction['targets']>;
    transaction: WalletAccountTransaction;
    singleRowLayout?: boolean;
    useAnimation?: boolean;
}

export const Target = ({ target, transaction, useAnimation, singleRowLayout }: TargetProps) => {
    const targetAmount = getTargetAmount(target, transaction);
    const operation = getTxOperation(transaction);

    return (
        <BaseTargetLayout
            useAnimation={useAnimation}
            addressLabel={<TargetAddressLabel target={target} type={transaction.type} />}
            amount={
                targetAmount && !singleRowLayout ? (
                    <StyledHiddenPlaceholder>
                        {operation && <Sign value={operation} />}
                        {targetAmount} {transaction.symbol}
                    </StyledHiddenPlaceholder>
                ) : undefined
            }
            fiatAmount={
                !isTestnet(transaction.symbol) && targetAmount ? (
                    <FiatValue
                        amount={targetAmount}
                        symbol={transaction.symbol}
                        source={transaction.rates}
                        useCustomSource
                    />
                ) : undefined
            }
        />
    );
};

export const FeeRow = ({
    transaction,
    useFiatValues,
}: {
    transaction: WalletAccountTransaction;
    useFiatValues?: boolean;
}) => {
    return (
        <BaseTargetLayout
            addressLabel={<Translation id="TR_FEE" />}
            amount={
                <StyledHiddenPlaceholder>
                    <Sign value="neg" />
                    {transaction.fee} {transaction.symbol}
                </StyledHiddenPlaceholder>
            }
            fiatAmount={
                useFiatValues ? (
                    <FiatValue
                        amount={transaction.fee}
                        symbol={transaction.symbol}
                        source={transaction.rates}
                        useCustomSource
                    />
                ) : undefined
            }
        />
    );
};
