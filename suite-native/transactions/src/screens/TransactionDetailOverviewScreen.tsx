import { useMemo, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { RouteProp, useRoute } from '@react-navigation/native';

import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { TransactionsRootState } from '@suite-common/wallet-core';
import { Box, Card, Text, Toggle, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenHeader,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ChangeAddressesHeader } from '../components/TransactionDetail/ChangeAddressesHeader';
import { selectTransactionAddresses } from '../selectors';
import { AddressesType, VinVoutAddress } from '../types';

const addressStyle = prepareNativeStyle(_ => ({ maxWidth: '90%' }));

const copyContainerStyle = prepareNativeStyle(utils => ({
    flex: 1,
    paddingTop: utils.spacings.sp4,
    marginHorizontal: utils.spacings.sp8,
}));

export const formatAddressesCount = (count: number) => {
    if (count > 1) {
        return `· ${count}`;
    }

    return '';
};

const AddressRow = ({ address }: { address: string }) => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const copyToClipboard = useCopyToClipboard();

    const handleCopy = () =>
        copyToClipboard(
            address,
            translate('transactions.TransactionDetailScreen.addressesSheet.copied'),
        );

    return (
        <Box flex={1} flexDirection="row" justifyContent="space-between" alignItems="flex-start">
            <Box style={applyStyle(addressStyle)}>
                <Text variant="hint">{address}</Text>
            </Box>

            <TouchableOpacity style={applyStyle(copyContainerStyle)} onPress={handleCopy}>
                <Icon name="copy" color="iconPrimaryDefault" size="medium" />
            </TouchableOpacity>
        </Box>
    );
};

const AddressesListCard = ({ addresses }: { addresses: VinVoutAddress[] }) => (
    <Card>
        <VStack spacing="sp16">
            {addresses.map(({ address, outputIndex }) => (
                <AddressRow key={outputIndex} address={address} />
            ))}
        </VStack>
    </Card>
);

type RouteProps = RouteProp<RootStackParamList, RootStackRoutes.TransactionDetailOverview>;

export const TransactionDetailOverviewScreen = () => {
    const route = useRoute<RouteProps>();
    const { txid, accountKey } = route.params;

    const [displayedAddressesType, setDisplayedAddressesType] = useState<AddressesType>('inputs');

    const inputAddresses = useSelector((state: TransactionsRootState & TokenDefinitionsRootState) =>
        selectTransactionAddresses(state, accountKey, txid, 'inputs'),
    );
    const outputAddresses = useSelector(
        (state: TransactionsRootState & TokenDefinitionsRootState) =>
            selectTransactionAddresses(state, accountKey, txid, 'outputs'),
    );

    const displayedAddresses =
        displayedAddressesType === 'inputs' ? inputAddresses : outputAddresses;

    const { targetAddresses, changeAddresses } = useMemo(
        () => ({
            targetAddresses: displayedAddresses.filter(({ isChangeAddress }) => !isChangeAddress),
            changeAddresses: displayedAddresses.filter(({ isChangeAddress }) => isChangeAddress),
        }),
        [displayedAddresses],
    );

    const toggleAddresses = () => {
        setDisplayedAddressesType(displayedAddressesType === 'inputs' ? 'outputs' : 'inputs');
    };

    return (
        <Screen header={<ScreenHeader />}>
            <Box>
                <Toggle
                    isToggled={displayedAddressesType === 'outputs'}
                    onToggle={toggleAddresses}
                    leftLabel={
                        <Translation
                            id="transactions.TransactionDetailScreen.addressesSheet.from"
                            values={{ count: formatAddressesCount(inputAddresses.length) }}
                        />
                    }
                    rightLabel={
                        <Translation
                            id="transactions.TransactionDetailScreen.addressesSheet.to"
                            values={{ count: formatAddressesCount(outputAddresses.length) }}
                        />
                    }
                />
                <Box marginVertical="sp16">
                    <VStack spacing="sp16">
                        <AddressesListCard addresses={targetAddresses} />

                        {A.isNotEmpty(changeAddresses) && (
                            <>
                                <ChangeAddressesHeader addressesCount={changeAddresses.length} />
                                <AddressesListCard addresses={changeAddresses} />
                            </>
                        )}
                    </VStack>
                </Box>
            </Box>
        </Screen>
    );
};
