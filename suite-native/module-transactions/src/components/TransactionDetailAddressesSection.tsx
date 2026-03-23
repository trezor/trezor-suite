import React, { useMemo } from 'react';

import { Box, CardDivider, Text, TextButton, VStack } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';
import { type WalletAccountTransaction } from '@suite-native/tokens';
import { type VinVoutAddress } from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ChangeAddressesHeader } from './ChangeAddressesHeader';
import { TransactionDetailStepper } from './TransactionDetailStepper';
import { SummaryRow } from './TransactionSummaryRow';
import { TransactionUtxoAddress } from './TransactionUtxoAddress';

type TransactionDetailAddressesSectionProps = {
    transaction: WalletAccountTransaction;
    addresses: VinVoutAddress[];
    addressesType: 'inputs' | 'outputs';
    onShowMore: () => void;
    showOutputLabels?: boolean;
};

const showMoreButtonContainerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    marginLeft: utils.spacings.sp32,
}));

export const formatAddressesCount = (count: number) => {
    if (count > 1) {
        return `· ${count}`;
    }

    return '';
};

export const TransactionDetailAddressesSection = ({
    transaction,
    addressesType,
    addresses,
    onShowMore,
    showOutputLabels = true,
}: TransactionDetailAddressesSectionProps) => {
    const { applyStyle } = useNativeStyles();

    const { targetAddresses, changeAddresses } = useMemo(
        () => ({
            targetAddresses: addresses.filter(({ isChangeAddress }) => !isChangeAddress),
            changeAddresses: addresses.filter(({ isChangeAddress }) => isChangeAddress),
        }),
        [addresses],
    );

    const titleTxKey: TxKeyPath =
        addressesType === 'inputs'
            ? 'transactions.TransactionDetailScreen.addressesSheet.from'
            : 'transactions.TransactionDetailScreen.addressesSheet.to';

    const isShowMoreButtonVisible = addresses.length > 2;
    const hiddenAddressesCount = targetAddresses.length - 2;
    const areChangeAddressesVisible = changeAddresses.length > 0;
    const shouldShowLabels = addressesType === 'outputs' && showOutputLabels;

    return (
        <VStack>
            <SummaryRow leftComponent={<TransactionDetailStepper />}>
                <Box>
                    <Text color="textSubdued" variant="body-sm">
                        <Translation
                            id={titleTxKey}
                            values={{ count: formatAddressesCount(targetAddresses.length) }}
                        />
                    </Text>
                    {targetAddresses.slice(0, 2).map(({ address, txTargetId }) => (
                        <TransactionUtxoAddress
                            key={`target-${txTargetId}`}
                            address={address}
                            txTargetId={txTargetId}
                            deviceStaticSessionId={transaction.deviceState}
                            txId={transaction.txid}
                            // Todo: input not implemented yet. The idea is, that transaction input is just output
                            //       of the previous transaction. So for inputs we would need to pass previous txid
                            //       (and figure out correct `n` output index of the utxo on the previous transaction)
                            showLabels={shouldShowLabels}
                            accountDescriptor={transaction.descriptor}
                            networkSymbol={transaction.symbol}
                        />
                    ))}
                </Box>
            </SummaryRow>

            {isShowMoreButtonVisible && (
                <Box style={applyStyle(showMoreButtonContainerStyle)}>
                    <TextButton onPress={onShowMore} isUnderlined>
                        <Translation
                            id="transactions.detail.showMoreButton"
                            values={{ amount: hiddenAddressesCount }}
                        />
                    </TextButton>
                </Box>
            )}

            {areChangeAddressesVisible && (
                <>
                    <CardDivider horizontalPadding="sp16" />
                    <SummaryRow leftComponent={<TransactionDetailStepper />}>
                        <Box>
                            <ChangeAddressesHeader addressesCount={changeAddresses.length} />
                            {changeAddresses.map(({ address, txTargetId }) => (
                                <TransactionUtxoAddress
                                    key={`change-${addressesType}:${txTargetId}`}
                                    address={address}
                                    txTargetId={txTargetId}
                                    deviceStaticSessionId={transaction.deviceState}
                                    txId={transaction.txid}
                                    // Todo: input not implemented yet. The idea is, that transaction input is just output
                                    //       of the previous transaction. So for inputs we would need to pass previous txid
                                    //       (and figure out correct `n` output index of the utxo on the previous transaction)
                                    showLabels={shouldShowLabels}
                                    accountDescriptor={transaction.descriptor}
                                    networkSymbol={transaction.symbol}
                                />
                            ))}
                        </Box>
                    </SummaryRow>
                </>
            )}
        </VStack>
    );
};
