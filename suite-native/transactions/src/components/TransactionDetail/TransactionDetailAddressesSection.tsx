import { useMemo } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress } from '@suite-common/wallet-types';
import { Box, CardDivider, Text, VStack } from '@suite-native/atoms';
import { AccountAddressFormatter } from '@suite-native/formatters';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ChangeAddressesHeader } from './ChangeAddressesHeader';
import { formatAddressLabel } from './TransactionDetailAddressesSheet';
import { SummaryRow } from './TransactionSummaryRow';
import { VinVoutAddress } from '../../types';

type TransactionDetailAddressesSectionProps = {
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

const addressTextStyle = prepareNativeStyle(_ => ({
    maxWidth: '80%',
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

    const formattedTitle = formatAddressLabel(addressesType, targetAddresses.length);

    const isShowMoreButtonVisible = addresses.length > 2;
    const hiddenAddressesCount = targetAddresses.length - 2;
    const areChangeAddressesVisible = changeAddresses.length > 0;

    return (
        <VStack>
            <SummaryRow leftComponent={<TransactionDetailSummaryStepper />}>
                <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Text color="textSubdued" variant="hint">
                            {formattedTitle}
                        </Text>
                        {targetAddresses.slice(0, 2).map(({ address }) => (
                            <AccountAddressFormatter
                                key={address}
                                value={address}
                                style={applyStyle(addressTextStyle)}
                            />
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
                                {changeAddresses.map(({ address }) => (
                                    <AccountAddressFormatter
                                        key={address}
                                        value={address}
                                        style={applyStyle(addressTextStyle)}
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
