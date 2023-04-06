import React from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { Box, Text } from '@suite-native/atoms';
import { AccountAddressFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CryptoIcon, CryptoIconName } from '@trezor/icons';

import { SummaryRow } from './TransactionDetailStatusSection';

type TransactionDetailAddressesSectionProps = {
    addresses: string[];
    addressesType: 'inputs' | 'outputs';
    onShowMore: () => void;
    cryptoIcon?: CryptoIconName;
};

const showMoreButtonStyle = prepareNativeStyle(_ => ({ flexDirection: 'row' }));

const hiddenTransactionsCountStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    marginLeft: utils.spacings.small,
    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation1,
    borderRadius: utils.borders.radii.round,
    paddingHorizontal: utils.spacings.small,
    paddingVertical: utils.spacings.small / 4,
}));

const addressTextStyle = prepareNativeStyle(_ => ({
    maxWidth: 160,
}));

const stepperDotWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: utils.spacings.small,
    backgroundColor: utils.colors.backgroundSurfaceElevation2,
    width: utils.spacings.medium,
    height: utils.spacings.medium,
    borderRadius: utils.borders.radii.round,
}));

const stepperDotStyle = prepareNativeStyle(utils => ({
    width: utils.spacings.small / 2,
    height: utils.spacings.small / 2,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundNeutralSubdued,
}));

const coinIconWrapperStyle = prepareNativeStyle(utils => ({
    alignSelf: 'flex-start',
    padding: utils.spacings.small * 1.5,
    backgroundColor: utils.colors.backgroundSurfaceElevation2,
    borderRadius: utils.borders.radii.round,
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
    cryptoIcon,
}: TransactionDetailAddressesSectionProps) => {
    const { applyStyle } = useNativeStyles();

    const titlePrefix = addressesType === 'inputs' ? 'From' : 'To';
    const formattedTitle =
        addresses.length > 1 ? `${titlePrefix}  ·  ${addresses.length}` : titlePrefix;

    const displayedAddresses = addresses.slice(0, 2);
    const isShowMoreButtonVisible = addresses.length > 2;
    const hiddenAddressesCount = addresses.length - 2;

    return (
        <SummaryRow leftComponent={<TransactionDetailSummaryStepper />}>
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                <Box>
                    <Text color="textSubdued" variant="hint">
                        {formattedTitle}
                    </Text>
                    {displayedAddresses.map(address => (
                        <AccountAddressFormatter
                            key={address}
                            value={address}
                            style={applyStyle(addressTextStyle)}
                        />
                    ))}
                    {isShowMoreButtonVisible && (
                        <Box marginTop="small" flexDirection="row">
                            <TouchableOpacity
                                onPress={onShowMore}
                                style={applyStyle(showMoreButtonStyle)}
                            >
                                <Text color="textPrimaryDefault">Show more</Text>
                                <Box style={applyStyle(hiddenTransactionsCountStyle)}>
                                    <Text variant="label" color="textSubdued">
                                        {hiddenAddressesCount}
                                    </Text>
                                </Box>
                            </TouchableOpacity>
                        </Box>
                    )}
                </Box>
                {cryptoIcon && (
                    <Box style={applyStyle(coinIconWrapperStyle)}>
                        <CryptoIcon name={cryptoIcon} size="extraSmall" />
                    </Box>
                )}
            </Box>
        </SummaryRow>
    );
};
