import { ReactNode } from 'react';

import styled from 'styled-components';

import {
    Address,
    H4,
    Column,
    Row,
    InfoItem,
    Text,
    Card,
    Divider,
    Icon,
    Indicator,
} from '@trezor/components';
import { TokenInfo } from '@trezor/connect';
import {
    amountToSmallestUnit,
    formatNetworkAmount,
    formatAmount,
} from '@suite-common/wallet-utils';
import { spacings } from '@trezor/theme';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { Account } from 'src/types/wallet';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';

// token name is fingerprint in Cardano
const getFingerprint = (
    tokens: Account['tokens'],
    symbol: string | undefined,
): string | undefined => {
    if (!tokens) {
        return undefined;
    }

    const token = tokens.find(token => token.symbol?.toLowerCase() === symbol?.toLowerCase());

    return token?.name;
};

const DataWrapper = styled.p`
    word-break: break-all;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
`;

const StatusIndicator = ({ state }: { state: TransactionReviewOutputElementProps['state'] }) => {
    switch (state) {
        case 'done':
            return <Icon size={spacings.md} variant="primary" name="check" />;
        case 'pending':
            return <Indicator />;
        default:
            return <Indicator isActive={true} />;
    }
};

const Value = ({
    value,
    type,
    symbol,
    token,
    isFee,
    isFiatVisible,
}: {
    value: string;
    type: OutputElementLine['type'];
    symbol: NetworkSymbol;
    isFiatVisible: boolean;
    isFee: boolean;
    token?: TokenInfo;
}) => {
    switch (type) {
        case 'address':
            return <Address value={value} />;
        case 'data':
            return <DataWrapper>{value}</DataWrapper>;
        case 'amount': {
            const formattedValue = token
                ? formatAmount(value, token.decimals)
                : formatNetworkAmount(value, symbol);

            return (
                <>
                    <FormattedCryptoAmount
                        disableHiddenPlaceholder
                        value={formattedValue}
                        symbol={
                            // TX fee is so far always paid in network native coin
                            !isFee && token ? token.symbol : symbol
                        }
                        contractAddress={token?.contract}
                        isTabular={false}
                    />
                    {symbol && isFiatVisible && !(!isFee && token) && (
                        <Text variant="tertiary">
                            <FiatValue
                                disableHiddenPlaceholder
                                amount={formattedValue}
                                symbol={symbol}
                            />
                        </Text>
                    )}
                </>
            );
        }
        default:
            return <Text>{value}</Text>;
    }
};

export type OutputElementLine = {
    id: string;
    value: string;
    type: 'default' | 'address' | 'data' | 'amount';
    label?: ReactNode;
};

export type TransactionReviewOutputElementProps = {
    title: ReactNode;
    lines: OutputElementLine[];
    account: Account;
    state: 'default' | 'done' | 'pending';
    fiatVisible?: boolean;
    token?: TokenInfo;
};

export const TransactionReviewOutputElement = ({
    title,
    lines,
    token,
    fiatVisible = false,
    account,
    state,
}: TransactionReviewOutputElementProps) => {
    const { networkType, symbol } = account;
    const cardanoFingerprint = getFingerprint(account?.tokens, token?.symbol);

    return (
        <Card paddingType="none" fillType={state === 'done' ? 'flat' : 'default'}>
            <Row padding={{ vertical: spacings.sm, horizontal: spacings.md }} gap={spacings.sm}>
                <StatusIndicator state={state} />
                <H4 typographyStyle={state !== 'pending' ? 'callout' : 'hint'}>{title}</H4>
            </Row>
            <Divider margin={{}} />
            <Column
                gap={spacings.md}
                padding={{
                    vertical: spacings.sm,
                    horizontal: spacings.md,
                    left: spacings.xxxxl,
                }}
            >
                {lines.map(line => {
                    const value = (
                        <Value
                            value={line.value}
                            type={line.type}
                            symbol={symbol}
                            token={token}
                            isFiatVisible={fiatVisible}
                            isFee={line.id === 'fee'}
                        />
                    );

                    return (
                        <div data-testid={`@modal/output-${line.id}`} key={line.id}>
                            <Text typographyStyle="hint" as="div">
                                {line.label ? (
                                    <InfoItem
                                        label={
                                            <Text
                                                variant="default"
                                                data-testid="@modal/output-headline"
                                            >
                                                {line.label}
                                            </Text>
                                        }
                                        direction="row"
                                    >
                                        <Column
                                            alignItems="flex-end"
                                            data-testid="@modal/output-value"
                                        >
                                            {value}
                                        </Column>
                                    </InfoItem>
                                ) : (
                                    <Text data-testid="@modal/output-value">{value}</Text>
                                )}
                            </Text>
                            {networkType === 'cardano' && cardanoFingerprint && (
                                <InfoItem
                                    label={
                                        <Text variant="default" typographyStyle="hint">
                                            <Translation id="TR_CARDANO_FINGERPRINT_HEADLINE" />
                                        </Text>
                                    }
                                    direction="row"
                                >
                                    {cardanoFingerprint}
                                </InfoItem>
                            )}
                            {networkType === 'cardano' && token && token.decimals !== 0 && (
                                <InfoItem
                                    label={
                                        <Text variant="default" typographyStyle="hint">
                                            <Translation id="TR_CARDANO_TREZOR_AMOUNT_HEADLINE" />
                                        </Text>
                                    }
                                    direction="row"
                                >
                                    {amountToSmallestUnit(line.value, token.decimals)}
                                </InfoItem>
                            )}
                        </div>
                    );
                })}
            </Column>
        </Card>
    );
};
