import React from 'react';
import styled from 'styled-components';
import { variables, colors } from '@trezor/components';
import { useSendFormContext } from '@wallet-hooks';
import { formatNetworkAmount, formatAmount } from '@wallet-utils/accountUtils';
import { Card, Translation, FiatValue, FormattedCryptoAmount } from '@suite-components';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: row;
    justify-items: space-between;
    align-items: center;
    min-height: 86px;
    padding: 0 42px;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Label = styled.div`
    padding-right: 10px;
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const SecondaryLabel = styled.div`
    padding-top: 2px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const Right = styled.div`
    display: flex;
    flex: 1;
    justify-content: center;
    flex-direction: column;
    align-items: flex-end;
`;

const TotalSentCoin = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    padding-bottom: 6px;
`;

const TotalSentFiat = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const TotalSent = () => {
    const {
        account: { symbol, networkType },
        composedLevels,
        getValues,
    } = useSendFormContext();

    const selectedFee = getValues().selectedFee || 'normal';
    const transactionInfo = composedLevels ? composedLevels[selectedFee] : undefined;
    const isTokenTransfer = networkType === 'ethereum' && !!getValues('outputs[0].token');
    const tokenInfo =
        transactionInfo && transactionInfo.type !== 'error' ? transactionInfo.token : undefined;

    return (
        <StyledCard>
            <Left>
                <Label>
                    <Translation id="TOTAL_SENT" />
                </Label>
                {!isTokenTransfer && (
                    <SecondaryLabel>
                        <Translation id="INCLUDING_FEE" />
                    </SecondaryLabel>
                )}
            </Left>
            {transactionInfo && transactionInfo.type !== 'error' && (
                <Right>
                    <TotalSentCoin>
                        <FormattedCryptoAmount
                            disableHiddenPlaceholder
                            value={
                                tokenInfo
                                    ? formatAmount(transactionInfo.totalSpent, tokenInfo.decimals)
                                    : formatNetworkAmount(transactionInfo.totalSpent, symbol)
                            }
                            symbol={tokenInfo ? tokenInfo.symbol : symbol}
                        />
                    </TotalSentCoin>
                    <TotalSentFiat>
                        {tokenInfo ? (
                            <>
                                <Translation id="FEE" />
                                <FormattedCryptoAmount
                                    disableHiddenPlaceholder
                                    value={formatNetworkAmount(transactionInfo.fee, symbol)}
                                    symbol={symbol}
                                />
                            </>
                        ) : (
                            <FiatValue
                                disableHiddenPlaceholder
                                amount={formatNetworkAmount(transactionInfo.totalSpent, symbol)}
                                symbol={symbol}
                            />
                        )}
                    </TotalSentFiat>
                </Right>
            )}
        </StyledCard>
    );
};

export default TotalSent;
