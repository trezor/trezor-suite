import { useMemo } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { Box, Divider, Text } from '@suite-native/atoms';
import { AccountAddressFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CoinSymbol, CryptoIcon } from '@suite-common/icons';

import { SummaryRow } from './TransactionDetailStatusSection';
import { formatAddressLabel } from './TransactionDetailAddressesSheet';
import { VinVoutAddress } from '../../types';
import { ChangeAddressesHeader } from './ChangeAddressesHeader';

type TransactionDetailAddressesSectionProps = {
    addresses: VinVoutAddress[];
    addressesType: 'inputs' | 'outputs';
    onShowMore: () => void;
    icon?: CoinSymbol;
};

const SHOW_MORE_BUTTON_MARGIN_LEFT = 52;

const showMoreButtonContainerStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    marginLeft: SHOW_MORE_BUTTON_MARGIN_LEFT,
}));
const showMoreButtonStyle = prepareNativeStyle(_ => ({ flexDirection: 'row' }));

const hiddenTransactionsCountStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    marginLeft: utils.spacings.s,
    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation1,
    borderRadius: utils.borders.radii.round,
    paddingHorizontal: utils.spacings.s,
    paddingVertical: utils.spacings.s / 4,
}));

const addressTextStyle = prepareNativeStyle(_ => ({
    maxWidth: '80%',
}));

const stepperDotWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: utils.spacings.s,
    backgroundColor: utils.colors.backgroundSurfaceElevation2,
    width: utils.spacings.m,
    height: utils.spacings.m,
    borderRadius: utils.borders.radii.round,
}));

const stepperDotStyle = prepareNativeStyle(utils => ({
    width: utils.spacings.xs,
    height: utils.spacings.xs,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundNeutralSubdued,
}));

const coinIconWrapperStyle = prepareNativeStyle(utils => ({
    alignSelf: 'flex-start',
    padding: utils.spacings.s * 1.5,
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
    icon,
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
        <>
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
                    {icon && (
                        <Box style={applyStyle(coinIconWrapperStyle)}>
                            <CryptoIcon symbol={icon} size="xs" />
                        </Box>
                    )}
                </Box>
            </SummaryRow>

            {areChangeAddressesVisible && (
                <>
                    <Divider />
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
            {isShowMoreButtonVisible && (
                <Box style={applyStyle(showMoreButtonContainerStyle)}>
                    <TouchableOpacity onPress={onShowMore} style={applyStyle(showMoreButtonStyle)}>
                        <Text color="textPrimaryDefault">Show more</Text>
                        <Box style={applyStyle(hiddenTransactionsCountStyle)}>
                            <Text variant="label" color="textSubdued">
                                {hiddenAddressesCount}
                            </Text>
                        </Box>
                    </TouchableOpacity>
                </Box>
            )}
        </>
    );
};
