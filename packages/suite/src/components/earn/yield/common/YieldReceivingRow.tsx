import { Translation } from '@suite/intl';
import { type YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { Box, Card, Row, Text } from '@trezor/components';
import { TokenIcon } from '@trezor/product-components';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

import { TruncatedAmount } from './TruncatedAmount';

type YieldReceivingRowProps = {
    token: YieldFlowDisplayToken;
    amount: string | null;
    testId: string;
};

export const YieldReceivingRow = ({ token, amount, testId }: YieldReceivingRowProps) => (
    <Card type="contrast" paddingType="small">
        <Row justifyContent="space-between" alignItems="center" width="100%" gap={8}>
            <Text typographyStyle="body-md">
                <Translation id="TR_EARN_YIELD_WRAP_RECEIVING" />
            </Text>
            <Row alignItems="center" gap={8} minWidth={0}>
                <TokenIcon
                    size={20}
                    networkSymbol={token.networkSymbol}
                    contractAddress={token.contractAddress ?? null}
                    placeholder={token.symbol}
                    showNetworkIcon
                    isBordered={false}
                />
                <Box minWidth={0} data-testid={testId}>
                    <TruncatedAmount>
                        <Text typographyStyle="body-md" ellipsisLineCount={1}>
                            {amount === null ? (
                                '–'
                            ) : (
                                <FormattedCryptoAmount
                                    value={amount}
                                    networkSymbol={token.symbol}
                                />
                            )}
                        </Text>
                    </TruncatedAmount>
                </Box>
            </Row>
        </Row>
    </Card>
);
