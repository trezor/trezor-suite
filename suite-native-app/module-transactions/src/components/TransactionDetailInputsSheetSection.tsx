import { Fragment, type ReactNode } from 'react';

import { A, G } from '@mobily/ts-belt';

import { useTokenMetadata } from '@suite-common/token';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Card, Text } from '@suite-native/atoms';
import { ClipboardCopyMenu } from '@suite-native/clipboard';
import {
    AddressFormatter,
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    convertTokenValueToDecimal,
} from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { type TransactionTranfer } from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TransferAmountProps = {
    amount: string;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

const TransferAmount = ({ amount, networkSymbol, tokenContract }: TransferAmountProps) => {
    const token = useTokenMetadata(networkSymbol, tokenContract);

    if (!tokenContract) {
        return (
            <ExactCryptoAmountFormatter
                value={amount}
                symbol={networkSymbol}
                isBalance={false}
                variant="body-xs"
                numberOfLines={1}
                adjustsFontSizeToFit
            />
        );
    }

    return (
        <ExactTokenAmountFormatter
            networkSymbol={networkSymbol}
            contractAddress={tokenContract}
            value={convertTokenValueToDecimal(amount, token?.decimals ?? 0)}
            variant="body-xs"
            numberOfLines={1}
            adjustsFontSizeToFit
        />
    );
};

type TransactionAddressAmountProps = {
    address: string;
    amount?: string;
    networkSymbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

const addressAmountColumnStyle = prepareNativeStyle(_ => ({
    maxWidth: '42.5%',
}));

const TransactionAddressAmount = ({
    address,
    amount,
    networkSymbol,
    tokenContract,
}: TransactionAddressAmountProps) => (
    <Box>
        {address ? (
            <ClipboardCopyMenu value={address}>
                <AddressFormatter value={address} variant="body-sm" format="short" />
            </ClipboardCopyMenu>
        ) : (
            <AddressFormatter value={address} variant="body-sm" format="short" />
        )}
        {amount && (
            <TransferAmount
                amount={amount}
                networkSymbol={networkSymbol}
                tokenContract={tokenContract}
            />
        )}
    </Box>
);

type TransactionTransferSectionProps = {
    networkSymbol: NetworkSymbol;
    transfers: TransactionTranfer[];
    header: ReactNode;
};

export const TransactionDetailInputsSheetSection = ({
    networkSymbol,
    transfers,
    header,
}: TransactionTransferSectionProps) => {
    const { applyStyle } = useNativeStyles();

    if (A.isEmpty(transfers)) return null;

    return (
        <Box>
            {G.isString(header) ? (
                <Box paddingLeft="sp8" marginVertical="sp8">
                    <Text color="contentSecondary" variant="body-sm">
                        {header}
                    </Text>
                </Box>
            ) : (
                header
            )}
            <Card>
                <Box flexDirection="row" justifyContent="space-between">
                    {transfers.map(({ inputs, outputs, tokenContract }) => (
                        <Fragment key={tokenContract ?? networkSymbol}>
                            <Box style={applyStyle(addressAmountColumnStyle)}>
                                {inputs.map(({ address, amount }, index) => (
                                    <TransactionAddressAmount
                                        key={`${address}:${index}`}
                                        address={address}
                                        amount={amount}
                                        networkSymbol={networkSymbol}
                                        tokenContract={tokenContract}
                                    />
                                ))}
                            </Box>
                            <Icon name="caretCircleRight" color="contentDisabled" size="medium" />
                            <Box style={applyStyle(addressAmountColumnStyle)}>
                                {outputs.map(({ address, amount }, index) => (
                                    <TransactionAddressAmount
                                        key={`${address}:${index}`}
                                        address={address}
                                        amount={amount}
                                        networkSymbol={networkSymbol}
                                        tokenContract={tokenContract}
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
