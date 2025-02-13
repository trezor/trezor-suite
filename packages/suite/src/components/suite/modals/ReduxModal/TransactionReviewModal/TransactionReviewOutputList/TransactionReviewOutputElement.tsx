import { ReactNode } from 'react';

import styled from 'styled-components';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { formatAmount, formatNetworkAmount } from '@suite-common/wallet-utils';
import {
    Card,
    Column,
    DotIndicator,
    H4,
    Icon,
    InfoItem,
    Note,
    Row,
    Text,
} from '@trezor/components';
import { TokenInfo } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { Address, FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { Account } from 'src/types/wallet';

const getCardanoFingerprint = (
    tokens: Account['tokens'],
    symbol: string | undefined,
): string | undefined => {
    if (!tokens) {
        return undefined;
    }

    const token = tokens.find(token => token.symbol?.toLowerCase() === symbol?.toLowerCase());

    return token?.fingerprint;
};

const DataWrapper = styled.p`
    word-break: break-all;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
`;

const Status = ({ state }: { state: TransactionReviewOutputElementProps['state'] }) => {
    switch (state) {
        case 'confirmed':
            return <Icon size={spacings.md} variant="primary" name="check" />;
        case 'unconfirmed':
            return <DotIndicator />;
        default:
            return <DotIndicator isActive={true} />;
    }
};

type ValueProps = {
    value: string;
    type: OutputElementLine['type'];
    symbol: NetworkSymbol;
    isFiatVisible: boolean;
    isFee: boolean;
    state: TransactionReviewOutputElementProps['state'];
    token?: TokenInfo;
};

const Value = ({ value, type, symbol, token, isFee, isFiatVisible, state }: ValueProps) => {
    switch (type) {
        case 'address':
            return state !== 'confirmed' ? (
                <Note>
                    <Translation id="TR_SEND_ADDRESS_CONFIRMATION_NOTE" />
                </Note>
            ) : (
                <Address value={value} />
            );
        case 'safe-address':
            return <Address value={value} />;
        case 'data':
            return <DataWrapper>{value}</DataWrapper>;
        case 'amount': {
            const isTokenAmount = !isFee && token;
            const formattedValue = isTokenAmount
                ? formatAmount(value, token.decimals)
                : formatNetworkAmount(value, symbol);

            return (
                <>
                    <FormattedCryptoAmount
                        data-testid="@modal/crypto-amount"
                        disableHiddenPlaceholder
                        value={formattedValue}
                        symbol={
                            // TX fee is so far always paid in network native coin
                            isTokenAmount ? token.symbol : symbol
                        }
                        contractAddress={token?.contract}
                        isTabular={false}
                    />
                    {symbol && isFiatVisible && (
                        <Text variant="tertiary" data-testid="@modal/fiat-amount">
                            <FiatValue
                                disableHiddenPlaceholder
                                amount={formattedValue}
                                tokenAddress={
                                    token && !isFee ? (token.contract as TokenAddress) : undefined
                                }
                                symbol={symbol}
                            />
                        </Text>
                    )}
                </>
            );
        }
        case 'default':
            return <Text>{value}</Text>;
        default: {
            const _unhandledCase: never = type;
            throw new Error(`Unhandled type: ${_unhandledCase}`);
        }
    }
};

export type OutputElementLine = {
    id: string;
    value: string;
    type: 'default' | 'address' | 'safe-address' | 'data' | 'amount';
    label?: ReactNode;
};

export type TransactionReviewOutputElementProps = {
    title: ReactNode;
    lines: OutputElementLine[];
    account: Account;
    state: 'active' | 'confirmed' | 'unconfirmed';
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

    return (
        <Card
            paddingType="small"
            fillType={state === 'confirmed' ? 'flat' : 'default'}
            heading={
                <Row gap={spacings.sm}>
                    <Status state={state} />
                    <H4
                        margin={{ left: spacings.xxs }}
                        typographyStyle={state !== 'unconfirmed' ? 'callout' : 'hint'}
                    >
                        {title}
                    </H4>
                </Row>
            }
        >
            <Column gap={spacings.md} padding={{ left: spacings.xxl }}>
                {lines.map(line => {
                    const value = (
                        <Value
                            value={line.value}
                            type={line.type}
                            symbol={symbol}
                            token={token}
                            isFiatVisible={fiatVisible}
                            isFee={line.id === 'fee'}
                            state={state}
                        />
                    );

                    return (
                        <Column data-testid={`@modal/output-${line.id}`} key={line.id}>
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
                            {networkType === 'cardano' && token?.symbol && (
                                <Text typographyStyle="hint" as="div">
                                    <InfoItem
                                        label={
                                            <Text variant="default">
                                                <Translation id="TR_CARDANO_FINGERPRINT_HEADLINE" />
                                            </Text>
                                        }
                                        direction="row"
                                    >
                                        <Column
                                            alignItems="flex-end"
                                            data-testid="@modal/cardano-fingerprint"
                                        >
                                            {getCardanoFingerprint(account?.tokens, token?.symbol)}
                                        </Column>
                                    </InfoItem>
                                </Text>
                            )}
                            {networkType === 'cardano' && token && token.decimals !== 0 && (
                                <Text typographyStyle="hint" as="div">
                                    <InfoItem
                                        label={
                                            <Text variant="default">
                                                <Translation id="TR_CARDANO_TREZOR_AMOUNT_HEADLINE" />
                                            </Text>
                                        }
                                        direction="row"
                                    >
                                        <Column
                                            alignItems="flex-end"
                                            data-testid="@modal/cardano-trezor-amount"
                                        >
                                            {line.value}
                                        </Column>
                                    </InfoItem>
                                </Text>
                            )}
                        </Column>
                    );
                })}
            </Column>
        </Card>
    );
};
