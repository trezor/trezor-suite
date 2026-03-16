import { Fragment, type ReactNode } from 'react';

import { A, G } from '@mobily/ts-belt';

import { type NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { Box, Card, Text } from '@suite-native/atoms';
import {
    AddressFormatter,
    CryptoAmountFormatter,
    TokenAmountFormatter,
} from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { type TransactionTranfer } from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TransactionAddressAmountProps = {
    address: string;
    amount?: string;
    symbol: NetworkSymbol | TokenSymbol;
    decimals?: number;
};

const addressAmountColumnStyle = prepareNativeStyle(_ => ({
    maxWidth: '42.5%',
}));

const TransactionAddressAmount = ({
    address,
    amount,
    symbol,
    decimals,
}: TransactionAddressAmountProps) => (
    <Box>
        <AddressFormatter value={address} variant="body-sm" />
        {amount &&
            (isNetworkSymbol(symbol) ? (
                <CryptoAmountFormatter
                    value={amount}
                    symbol={symbol}
                    isBalance={false}
                    variant="body-xs"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            ) : (
                <TokenAmountFormatter
                    value={amount}
                    tokenSymbol={symbol}
                    decimals={decimals}
                    variant="body-xs"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            ))}
    </Box>
);

type TransactionTransferSectionProps = {
    transfers: TransactionTranfer[];
    header: ReactNode;
};

export const TransactionDetailInputsSheetSection = ({
    transfers,
    header,
}: TransactionTransferSectionProps) => {
    const { applyStyle } = useNativeStyles();

    if (A.isEmpty(transfers)) return null;

    return (
        <Box>
            {G.isString(header) ? (
                <Box paddingLeft="sp8" marginVertical="sp8">
                    <Text color="textSubdued" variant="body-sm">
                        {header}
                    </Text>
                </Box>
            ) : (
                header
            )}
            <Card>
                <Box flexDirection="row" justifyContent="space-between">
                    {transfers.map(({ inputs, outputs, symbol, decimals }) => (
                        <Fragment key={symbol}>
                            <Box style={applyStyle(addressAmountColumnStyle)}>
                                {inputs.map(({ address, amount }, index) => (
                                    <TransactionAddressAmount
                                        key={`${address}:${index}`}
                                        address={address}
                                        amount={amount}
                                        symbol={symbol}
                                        decimals={decimals}
                                    />
                                ))}
                            </Box>
                            <Icon name="caretCircleRight" color="iconDisabled" size="medium" />
                            <Box style={applyStyle(addressAmountColumnStyle)}>
                                {outputs.map(({ address, amount }, index) => (
                                    <TransactionAddressAmount
                                        key={`${address}:${index}`}
                                        address={address}
                                        amount={amount}
                                        symbol={symbol}
                                        decimals={decimals}
                                    />
                                ))}
                            </Box>
                        </Fragment>
                    ))}
                </Box>
            </Card>
        </Box>
    );
};
