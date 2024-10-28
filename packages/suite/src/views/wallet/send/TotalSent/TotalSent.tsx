import styled from 'styled-components';
import { Card, Column, InfoRow, Text } from '@trezor/components';
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
                    <InfoRow
                        label={
                            <Text variant="default" typographyStyle="body">
                                <Translation id="TOTAL_SENT" />
                            </Text>
                        }
                        direction="row"
                    >
                        {hasTransactionInfo && (
                            <FormattedCryptoAmount
                                disableHiddenPlaceholder
                                value={
                                    tokenInfo
                                        ? formatAmount(
                                              transactionInfo.totalSpent,
                                              tokenInfo.decimals,
                                          )
                                        : formatNetworkAmount(transactionInfo.totalSpent, symbol)
                                }
                                symbol={tokenInfo ? tokenInfo.symbol : symbol}
                            />
                        )}
                    </InfoRow>
                    <InfoRow
                        label={<Translation id={isTokenTransfer ? 'FEE' : 'INCLUDING_FEE'} />}
                        direction="row"
                        typographyStyle="hint"
                    >
                        {hasTransactionInfo &&
                            (tokenInfo ? (
                                <FormattedCryptoAmount
                                    disableHiddenPlaceholder
                                    value={formatNetworkAmount(transactionInfo.fee, symbol)}
                                    symbol={symbol}
                                />
                            ) : (
                                <FiatValue
                                    disableHiddenPlaceholder
                                    amount={formatNetworkAmount(transactionInfo.totalSpent, symbol)}
                                    symbol={symbol}
                                />
                            ))}
                    </InfoRow>
                </Column>
                <ReviewButton />
            </Card>
        </Container>
    );
};
