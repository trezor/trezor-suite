import styled from 'styled-components';
import { Card, Row, Column, Paragraph } from '@trezor/components';
import { useSendFormContext } from 'src/hooks/wallet';
import { formatNetworkAmount, formatAmount } from '@suite-common/wallet-utils';
import { Translation, FiatValue, FormattedCryptoAmount } from 'src/components/suite';
import { ReviewButton } from './ReviewButton';
import { spacings } from '@trezor/theme';

const Container = styled.div`
    position: sticky;
    top: 80px;
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
    const hasTransactionInfo = transactionInfo && transactionInfo.type !== 'error';
    const tokenInfo = hasTransactionInfo ? transactionInfo.token : undefined;

    return (
        <Container>
            <Card height="min-content" fillType="none">
                <Column gap={spacings.xxs} alignItems="stretch" margin={{ bottom: spacings.xl }}>
                    <Row justifyContent="space-between" gap={spacings.md}>
                        <Translation id="TOTAL_SENT" />
                        {hasTransactionInfo && (
                            <Paragraph align="right">
                                <FormattedCryptoAmount
                                    disableHiddenPlaceholder
                                    value={
                                        tokenInfo
                                            ? formatAmount(
                                                  transactionInfo.totalSpent,
                                                  tokenInfo.decimals,
                                              )
                                            : formatNetworkAmount(
                                                  transactionInfo.totalSpent,
                                                  symbol,
                                              )
                                    }
                                    symbol={tokenInfo ? tokenInfo.symbol : symbol}
                                />
                            </Paragraph>
                        )}
                    </Row>
                    <Row justifyContent="space-between" gap={spacings.md}>
                        {!isTokenTransfer && (
                            <Paragraph variant="tertiary" typographyStyle="hint">
                                <Translation id="INCLUDING_FEE" />
                            </Paragraph>
                        )}
                        {hasTransactionInfo && (
                            <Paragraph
                                align="right"
                                margin={{ left: 'auto' }}
                                variant="tertiary"
                                typographyStyle="hint"
                            >
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
                                        amount={formatNetworkAmount(
                                            transactionInfo.totalSpent,
                                            symbol,
                                        )}
                                        symbol={symbol}
                                    />
                                )}
                            </Paragraph>
                        )}
                    </Row>
                </Column>
                <ReviewButton />
            </Card>
        </Container>
    );
};
