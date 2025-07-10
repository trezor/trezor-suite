import { ReactNode, useState } from 'react';

import styled, { css } from 'styled-components';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { convertAmountSubunitsToUnits, formatNetworkAmount } from '@suite-common/wallet-utils';
import {
    Box,
    Card,
    Column,
    H4,
    InfoItem,
    Note,
    Row,
    Text,
    TextButton,
    useElevation,
} from '@trezor/components';
import { TokenInfo } from '@trezor/connect';
import { Elevation, mapElevationToBackground, spacings } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

import {
    Address,
    BaseCurrencyValue,
    FormattedCryptoAmount,
    Translation,
} from 'src/components/suite';
import { TransactionReviewOutputStatus } from 'src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputStatus';
import { useDisplayBaseCurrency } from 'src/hooks/suite/useDisplayBaseCurrency';
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

const DataWrapper = styled.p<{ $isExpanded: boolean; $elevation: Elevation }>`
    word-break: break-all;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
    cursor: pointer;
    position: relative;

    ${({ $isExpanded, $elevation, theme }) =>
        !$isExpanded &&
        css`
            max-height: 100px;
            overflow: hidden;
            text-overflow: ellipsis;

            /* Bottom shadow */
            &::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 40px;
                background: linear-gradient(
                    to bottom,
                    rgb(0 0 0 / 0%) 0%,
                    ${mapElevationToBackground({ theme, $elevation })} 100%
                );
                pointer-events: none;
            }
        `}
`;

const MAX_COLLAPSED_DATA_LENGTH = 400;

const Data = ({ value }: { value: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { parentElevation } = useElevation();
    const isTooLong = value.length > MAX_COLLAPSED_DATA_LENGTH;

    if (!isTooLong) {
        return (
            <DataWrapper $isExpanded $elevation={parentElevation}>
                {value}
            </DataWrapper>
        );
    }

    return (
        <Box>
            <DataWrapper
                onClick={() => setIsExpanded(!isExpanded)}
                $isExpanded={isExpanded}
                $elevation={parentElevation}
            >
                {isExpanded ? value : value.slice(0, MAX_COLLAPSED_DATA_LENGTH)}
            </DataWrapper>
            <Row justifyContent="center">
                <TextButton
                    variant="tertiary"
                    icon={isExpanded ? 'caretUp' : 'caretDown'}
                    iconAlignment="start"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <Translation id={isExpanded ? 'TR_SHOW_LESS' : 'TR_SHOW_MORE'} />
                </TextButton>
            </Row>
        </Box>
    );
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
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);

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
            return <Data value={value} />;
        case 'amount': {
            const isTokenAmount = !isFee && token;
            const formattedValue = isTokenAmount
                ? convertAmountSubunitsToUnits(value, token.decimals)
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
                        contractAddress={isTokenAmount ? token?.contract : undefined}
                        isTabular={false}
                    />
                    {shallDisplayBaseCurrency && isFiatVisible && (
                        <Text variant="tertiary" data-testid="@modal/fiat-amount">
                            <BaseCurrencyValue
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
        default:
            return exhaustive(type);
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
    account: Pick<Account, 'networkType' | 'symbol' | 'tokens'>;
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
            header={
                <Row gap={spacings.sm}>
                    <TransactionReviewOutputStatus state={state} />
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
                                        verticalAlignment="start"
                                    >
                                        <Text
                                            as="div"
                                            align="end"
                                            data-testid="@modal/output-value"
                                        >
                                            {value}
                                        </Text>
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
