import styled from 'styled-components';
import { Card, variables } from '@trezor/components';
import { useSendFormContext } from 'src/hooks/wallet';
import { formatNetworkAmount, formatAmount } from '@suite-common/wallet-utils';
import { Translation, FiatValue, FormattedCryptoAmount } from 'src/components/suite';
import { ReviewButton } from './ReviewButton';
import { spacingsPx } from '@trezor/theme';

const StyledCard = styled(Card)`
    position: sticky;
    top: 60px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${spacingsPx.md} 0;
    align-items: start;
    height: min-content;
    background: transparent;
    box-shadow: none;
    border: 1px solid ${({ theme }) => theme.borderOnElevation0};
`;

const Left = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Label = styled.div`
    padding-right: 10px;
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const SecondaryLabel = styled.div`
    padding-top: 2px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Right = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: flex-end;
`;

const TotalSentCoin = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    padding-bottom: 6px;
`;

const TotalSentFiat = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export const TotalSent = () => {
    const {
        account: { symbol, networkType },
        composedLevels,
        getValues,
    } = useSendFormContext();

    const selectedFee = getValues().selectedFee || 'normal';
    const transactionInfo = composedLevels ? composedLevels[selectedFee] : undefined;
    const isTokenTransfer = networkType === 'ethereum' && !!getValues('outputs.0.token');
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
                                &nbsp;
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

            <ReviewButton />
        </StyledCard>
    );
};
