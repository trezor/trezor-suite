import React from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { Translation, HiddenPlaceholder, Sign } from '@suite-components';
import { isTxUnknown, getTargetAmount, getTxOperation } from '@wallet-utils/transactionUtils';
import { WalletAccountTransaction } from '@wallet-types';

const Wrapper = styled.span`
    flex: 1 1 auto;
    text-overflow: ellipsis;
    overflow: hidden;
`;

const CryptoAmount = styled.span`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    /* line-height: 1.5; */
    text-transform: uppercase;
    white-space: nowrap;
    flex: 0;
`;

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
    /* padding: 8px 0px; row padding */
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

interface Props {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    useSingleRowLayout: boolean;
}

const TransactionHeading = ({ transaction, isPending, useSingleRowLayout }: Props) => {
    const isTokenTransaction = transaction.tokens.length > 0;
    const target = transaction.targets[0];
    const transfer = transaction.tokens[0];
    const symbol = !isTokenTransaction
        ? transaction.symbol.toUpperCase()
        : transfer.symbol.toUpperCase();
    let amount = null;

    if (useSingleRowLayout) {
        const targetAmount = !isTokenTransaction
            ? getTargetAmount(target, transaction)
            : transfer.amount;
        const operation = getTxOperation(transaction);
        amount = (
            <CryptoAmount>
                {targetAmount && (
                    <StyledHiddenPlaceholder>
                        {operation && <Sign value={operation} />}
                        {targetAmount} {symbol}
                    </StyledHiddenPlaceholder>
                )}
            </CryptoAmount>
        );
    }

    // TODO: intl once the structure and all combinations are decided
    let heading = null;
    // const symbol = transaction.symbol.toUpperCase();

    if (isTxUnknown(transaction)) {
        heading = <Translation id="TR_UNKNOWN_TRANSACTION" />;
    } else if (transaction.type === 'sent') {
        heading = isPending ? `Sending ${symbol}` : `Sent ${symbol}`;
    } else if (transaction.type === 'recv') {
        heading = isPending ? `Receiving ${symbol}` : `Received ${symbol}`;
    } else if (transaction.type === 'self') {
        heading = isPending ? `Sending ${symbol} to myself` : `Sent ${symbol} to myself`;
    } else {
        heading = <Translation id="TR_UNKNOWN_TRANSACTION" />;
    }

    return (
        <>
            <Wrapper>{heading}</Wrapper>
            {amount}
        </>
    );
};

export default TransactionHeading;
