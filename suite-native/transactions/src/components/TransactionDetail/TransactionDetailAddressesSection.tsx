import { useMemo } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { Box, CardDivider, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { WalletAccountTransaction } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ChangeAddressesHeader } from './ChangeAddressesHeader';
import { formatAddressesCount } from './TransactionDetailAddressesSheet';
import { SummaryRow } from './TransactionSummaryRow';
import { TransactionUtxoAddress } from './TransactionUtxoAddress';
import { VinVoutAddress } from '../../types';

type TransactionDetailAddressesSectionProps = {
    transaction: WalletAccountTransaction;
    addresses: VinVoutAddress[];
    addressesType: 'inputs' | 'outputs';
    onShowMore: () => void;
    symbol?: NetworkSymbol;
    contractAddress?: TokenAddress;
};

const showMoreButtonContainerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    marginLeft: utils.spacings.sp32,
}));
const showMoreButtonStyle = prepareNativeStyle(_ => ({ flexDirection: 'row' }));

const hiddenTransactionsCountStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    marginLeft: utils.spacings.sp8,
    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation1,
    borderRadius: utils.borders.radii.round,
    paddingHorizontal: utils.spacings.sp8,
    paddingVertical: utils.spacings.sp2,
}));

const stepperDotWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: utils.spacings.sp12,
    backgroundColor: utils.colors.backgroundSurfaceElevation2,
    width: utils.spacings.sp16,
    height: utils.spacings.sp16,
    borderRadius: utils.borders.radii.round,
}));

const stepperDotStyle = prepareNativeStyle(utils => ({
    width: utils.spacings.sp4,
    height: utils.spacings.sp4,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundNeutralSubdued,
}));

const TransactionDetailSummaryStepper = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(stepperDotWrapperStyle)}>
            <Box style={applyStyle(stepperDotStyle)} />
        </Box>
    );
};

export const TransactionDetailAddressesSection = ({
    transaction,
    addressesType,
    addresses,
    onShowMore,
    symbol,
    contractAddress,
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

    return (
        <VStack>
            <SummaryRow leftComponent={<TransactionDetailSummaryStepper />}>
                <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Text color="textSubdued" variant="hint">
                            <Translation
                                id={titleTxKey}
                                values={{ count: formatAddressesCount(targetAddresses.length) }}
                            />
                        </Text>
                        {targetAddresses.slice(0, 2).map(({ address, n }) => (
                            <>
                                <Text>{isOwn && 'OWN'}</Text>
                                <TransactionUtxoAddress
                                    key={address}
                                    address={address}
                                    n={n}
                                    deviceStaticSessionId={transaction.deviceState}
                                    txId={transaction.txid}
                                    // Todo: input not implemented yet. The idea is, that transaction input is just output
                                    //       of the previous transaction. So for inputs we would need to pass previous txid
                                    //       (and figure out correct `n` output index of the utxo on the previous transaction)
                                    showLabels={addressesType === 'outputs'}
                                />
                            </>
                        ))}
                    </Box>

                    {symbol && (
                        <CryptoIconWithNetwork
                            symbol={symbol}
                            contractAddress={contractAddress}
                            size="small"
                        />
                    )}
                </Box>
            </SummaryRow>

            {isShowMoreButtonVisible && (
                <Box style={applyStyle(showMoreButtonContainerStyle)}>
                    <TouchableOpacity onPress={onShowMore} style={applyStyle(showMoreButtonStyle)}>
                        <Text color="textPrimaryDefault">
                            <Translation id="transactions.detail.showMoreButton" />
                        </Text>
                        <Box style={applyStyle(hiddenTransactionsCountStyle)}>
                            <Text variant="label" color="textSubdued">
                                {hiddenAddressesCount}
                            </Text>
                        </Box>
                    </TouchableOpacity>
                </Box>
            )}

            {areChangeAddressesVisible && (
                <>
                    <CardDivider horizontalPadding="sp16" />
                    <SummaryRow leftComponent={<TransactionDetailSummaryStepper />}>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Box>
                                <ChangeAddressesHeader addressesCount={changeAddresses.length} />
                                {changeAddresses.map(({ address, n }) => (
                                    <TransactionUtxoAddress
                                        key={address}
                                        address={address}
                                        n={n}
                                        deviceStaticSessionId={transaction.deviceState}
                                        txId={transaction.txid}
                                        // Todo: input not implemented yet. The idea is, that transaction input is just output
                                        //       of the previous transaction. So for inputs we would need to pass previous txid
                                        //       (and figure out correct `n` output index of the utxo on the previous transaction)
                                        showLabels={addressesType === 'outputs'}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </SummaryRow>
                </>
            )}
        </VStack>
    );
};
