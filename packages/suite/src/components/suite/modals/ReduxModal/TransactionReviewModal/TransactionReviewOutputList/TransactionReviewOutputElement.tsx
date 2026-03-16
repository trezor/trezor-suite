import { type ReactNode, useState } from 'react';

import styled, { css } from 'styled-components';

import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
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
import { type TokenInfo } from '@trezor/connect';
import { type Elevation, mapElevationToBackground, spacings } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

import { Address } from 'src/components/suite/Address';
import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { TransactionReviewOutputStatus } from 'src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputStatus';
import { type Account } from 'src/types/wallet';

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
                    intent="neutral"
                    iconLeft={isExpanded ? 'caretUp' : 'caretDown'}
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
    state: TransactionReviewOutputElementProps['state'];
    token?: TokenInfo;
};

const Value = ({ value, type, symbol, token, isFiatVisible, state }: ValueProps) => {
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);

    switch (type) {
        case 'address':
            return state !== 'confirmed' ? (
                <Note>
                    <Translation id="TR_SEND_ADDRESS_CONFIRMATION_NOTE" />
                </Note>
            ) : (
                <Address value={value} isDeviceRendered />
            );
        case 'safe-address':
            return <Address value={value} isDeviceRendered />;
        case 'data':
            return <Data value={value} />;
        case 'amount': {
            const formattedValue = token
                ? convertAmountSubunitsToUnits(value, token.decimals)
                : formatNetworkAmount(value, symbol);

            return (
                <Column alignItems="flex-end">
                    <FormattedCryptoAmount
                        data-testid="@modal/crypto-amount"
                        disableHiddenPlaceholder
                        value={formattedValue}
                        symbol={token?.symbol ?? symbol}
                        contractAddress={token?.contract}
                        isTabular={false}
                    />
                    {shallDisplayBaseCurrency && isFiatVisible && (
                        <Text
                            intent="neutral"
                            priority="secondary"
                            data-testid="@modal/fiat-amount"
                        >
                            <BaseCurrencyValue
                                disableHiddenPlaceholder
                                amount={formattedValue}
                                tokenAddress={token?.contract as TokenAddress}
                                symbol={symbol}
                            />
                        </Text>
                    )}
                </Column>
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
    token?: TokenInfo;
    type: 'default' | 'address' | 'safe-address' | 'data' | 'amount';
    label?: ReactNode;
};

export type TransactionReviewOutputElementProps = {
    title: ReactNode;
    lines: OutputElementLine[];
    account: Pick<Account, 'networkType' | 'symbol' | 'tokens'>;
    state: 'active' | 'confirmed' | 'unconfirmed';
    fiatVisible?: boolean;
};

export const TransactionReviewOutputElement = ({
    title,
    lines,
    fiatVisible = false,
    account,
    state,
}: TransactionReviewOutputElementProps) => {
    const { symbol } = account;

    return (
        <Card
            paddingType="small"
            fillType={state === 'confirmed' ? 'flat' : 'default'}
            header={
                <Row gap={spacings.sm}>
                    <TransactionReviewOutputStatus state={state} />
                    <H4
                        margin={{ left: spacings.xxs }}
                        typographyStyle={state !== 'unconfirmed' ? 'body-sm-strong' : 'body-sm'}
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
                            token={line.token}
                            isFiatVisible={fiatVisible}
                            state={state}
                        />
                    );

                    return (
                        <Column data-testid={`@modal/output-${line.id}`} key={line.id}>
                            <Text typographyStyle="body-sm" as="div">
                                {line.label ? (
                                    <InfoItem
                                        label={
                                            <Text
                                                intent="neutral"
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
                        </Column>
                    );
                })}
            </Column>
        </Card>
    );
};
