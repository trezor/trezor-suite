import { ReactNode, Fragment } from 'react';

import { A, G } from '@mobily/ts-belt';

import { Icon } from '@suite-common/icons';
import { NetworkSymbol, isNetworkSymbol } from '@suite-common/wallet-config';
import { TokenSymbol } from '@suite-common/wallet-types';
import { Box, Card, Text } from '@suite-native/atoms';
import {
    AccountAddressFormatter,
    CryptoAmountFormatter,
    EthereumTokenAmountFormatter,
} from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { TransactionTranfer } from '../../selectors';

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
        <AccountAddressFormatter value={address} variant="hint" />
        {amount &&
            (isNetworkSymbol(symbol) ? (
                <CryptoAmountFormatter
                    value={amount}
                    network={symbol}
                    isBalance={false}
                    variant="label"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            ) : (
                <EthereumTokenAmountFormatter
                    value={amount}
                    symbol={symbol}
                    decimals={decimals}
                    variant="label"
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
                <Box paddingLeft="s" marginVertical="s">
                    <Text color="textSubdued" variant="hint">
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
                                {inputs.map(({ address, amount }) => (
                                    <TransactionAddressAmount
                                        key={address}
                                        address={address}
                                        amount={amount}
                                        symbol={symbol}
                                        decimals={decimals}
                                    />
                                ))}
                            </Box>
                            <Icon name="circleRight" color="iconDisabled" size="m" />
                            <Box style={applyStyle(addressAmountColumnStyle)}>
                                {outputs.map(({ address, amount }) => (
                                    <TransactionAddressAmount
                                        key={address}
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
