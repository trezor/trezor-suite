import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { HiddenPlaceholder, FiatValue, Translation } from '@suite-components';
import { variables, colors, Button, Link } from '@trezor/components';
import { ArrayElement } from '@suite/types/utils';
import { getTxOperation, getTargetAmount } from '@wallet-utils/transactionUtils';
import { isTestnet } from '@wallet-utils/accountUtils';
import { WalletAccountTransaction } from '@wallet-types';
import Sign from '@suite-components/Sign';
import TokenTransferAddressLabel from '../TokenTransferAddressLabel';
import TargetAddressLabel from '../TargetAddressLabel';

const CryptoAmount = styled.span`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    /* line-height: 1.5; */
    text-transform: uppercase;
    white-space: nowrap;
`;

const FiatAmount = styled.span`
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.57;
`;

const TargetWrapper = styled(motion.div)`
    display: flex;
    flex: 1;
    justify-content: space-between;

    & + & {
        margin-top: 20px;
    }
`;

const TargetAmountsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
`;

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
    /* padding: 8px 0px; row padding */
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

const TargetAddress = styled(motion.div)`
    display: flex;
    flex: 1;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-variant-numeric: tabular-nums slashed-zero;
`;

const ANIMATION = {
    variants: {
        initial: {
            overflow: 'hidden',
            height: 0,
        },
        visible: {
            height: 'auto',
        },
    },
    initial: 'initial',
    animate: 'visible',
    exit: 'initial',
    transition: { duration: 0.24, ease: 'easeInOut' },
};

interface TokenTransferProps {
    transfer: ArrayElement<WalletAccountTransaction['tokens']>;
    transaction: WalletAccountTransaction;
    useAnimation?: boolean;
}

export const TokenTransfer = ({ transfer, transaction, useAnimation }: TokenTransferProps) => {
    const operation = getTxOperation(transaction);

    const animation = useAnimation ? ANIMATION : {};
    return (
        <TargetWrapper {...animation}>
            <TargetAddress>
                <StyledHiddenPlaceholder>
                    <TokenTransferAddressLabel transfer={transfer} type={transaction.type} />
                </StyledHiddenPlaceholder>
            </TargetAddress>
            <TargetAmountsWrapper>
                <CryptoAmount>
                    <StyledHiddenPlaceholder>
                        {operation && <Sign value={operation} />}
                        {transfer.amount} {transfer.symbol}
                    </StyledHiddenPlaceholder>
                </CryptoAmount>
            </TargetAmountsWrapper>
        </TargetWrapper>
    );
};

interface TargetProps {
    target: ArrayElement<WalletAccountTransaction['targets']>;
    transaction: WalletAccountTransaction;
    useAnimation?: boolean;
}

export const Target = ({ target, transaction, useAnimation }: TargetProps) => {
    const targetAmount = getTargetAmount(target, transaction);
    const operation = getTxOperation(transaction);
    const animation = useAnimation ? ANIMATION : {};

    return (
        <TargetWrapper {...animation}>
            <TargetAddress>
                <StyledHiddenPlaceholder>
                    <TargetAddressLabel target={target} type={transaction.type} />
                </StyledHiddenPlaceholder>
            </TargetAddress>
            <TargetAmountsWrapper>
                <CryptoAmount>
                    {targetAmount && (
                        <StyledHiddenPlaceholder>
                            {operation && <Sign value={operation} />}
                            {targetAmount} {transaction.symbol}
                        </StyledHiddenPlaceholder>
                    )}
                </CryptoAmount>
                <FiatAmount>
                    {!isTestnet(transaction.symbol) && targetAmount && (
                        <FiatValue
                            amount={targetAmount}
                            symbol={transaction.symbol}
                            source={transaction.rates}
                            useCustomSource
                        />
                    )}
                </FiatAmount>
            </TargetAmountsWrapper>
        </TargetWrapper>
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
        <TargetWrapper>
            <TargetAddress>
                <Translation id="TR_FEE" />
            </TargetAddress>
            <TargetAmountsWrapper>
                <CryptoAmount>
                    <StyledHiddenPlaceholder>
                        <Sign value="neg" />
                        {transaction.fee} {transaction.symbol}
                    </StyledHiddenPlaceholder>
                </CryptoAmount>
                <FiatAmount>
                    {useFiatValues && (
                        <FiatValue
                            amount={transaction.fee}
                            symbol={transaction.symbol}
                            source={transaction.rates}
                            useCustomSource
                        />
                    )}
                </FiatAmount>
            </TargetAmountsWrapper>
        </TargetWrapper>
    );
};
