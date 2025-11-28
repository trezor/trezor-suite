import { useMemo } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { RouteProp, useRoute } from '@react-navigation/native';

import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { TransactionsRootState } from '@suite-common/wallet-core';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { useCopyToClipboard } from '@suite-native/clipboard';
import { Icon, IconName } from '@suite-native/icons';
import { useTranslate } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    Screen,
    TransactionDetailStackParamList,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { VinVoutAddress, selectTransactionAddresses } from '@suite-native/transactions';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ChangeAddressesHeader } from '../components/ChangeAddressesHeader';

const addressCardStyle = prepareNativeStyle(utils => ({
    borderWidth: utils.borders.widths.small,
    borderColor: utils.colors.borderOnElevation0,
    backgroundColor: utils.colors.backgroundSurfaceElevationNegative,
    borderRadius: utils.borders.radii.r12,
}));

const addressStyle = prepareNativeStyle(_ => ({ maxWidth: '90%' }));

const AddressRow = ({ address }: { address: string }) => {
    const { applyStyle } = useNativeStyles();

    const { translate } = useTranslate();

    const copyToClipboard = useCopyToClipboard();

    const handleCopy = () =>
        copyToClipboard(
            address,
            translate('transactions.TransactionDetailScreen.addressesSheet.copied'),
        );

    return (
        <HStack
            paddingHorizontal="sp16"
            paddingVertical="sp12"
            style={applyStyle(addressCardStyle)}
        >
            <Text variant="hint" style={applyStyle(addressStyle)}>
                {address}
            </Text>
            <TouchableOpacity onPress={handleCopy}>
                <Icon name="copy" color="iconPrimaryDefault" size="medium" />
            </TouchableOpacity>
        </HStack>
    );
};

const AddressesListCard = ({ addresses }: { addresses: VinVoutAddress[] }) => (
    <>
        {addresses.map(({ address, outputIndex }) => (
            <AddressRow key={outputIndex} address={address} />
        ))}
    </>
);

type RouteProps = RouteProp<
    TransactionDetailStackParamList,
    TransactionDetailStackRoutes.TransactionDetailOverview
>;

const TransactionOverviewSectionHeader = ({
    iconName,
    title,
    count,
}: {
    iconName: IconName;
    title: string;
    count: number;
}) => (
    <HStack spacing="sp12" alignItems="center">
        <Icon name={iconName} size="mediumLarge" />
        <Text variant="highlight">
            {title} <Text color="textSubdued">· {count}</Text>
        </Text>
    </HStack>
);

const OverviewSubheader = ({ title, count }: { title: string; count: number }) => (
    <Text color="textSubdued" variant="hint">
        {title} · {count}
    </Text>
);

export const TransactionDetailOverviewScreen = () => {
    const route = useRoute<RouteProps>();
    const { txid, accountKey } = route.params;

    const inputAddresses = useSelector((state: TransactionsRootState & TokenDefinitionsRootState) =>
        selectTransactionAddresses(state, accountKey, txid, 'inputs'),
    );
    const outputAddresses = useSelector(
        (state: TransactionsRootState & TokenDefinitionsRootState) =>
            selectTransactionAddresses(state, accountKey, txid, 'outputs'),
    );

    const { targetAddresses, changeAddresses } = useMemo(
        () => ({
            targetAddresses: outputAddresses.filter(({ isChangeAddress }) => !isChangeAddress),
            changeAddresses: outputAddresses.filter(({ isChangeAddress }) => isChangeAddress),
        }),
        [outputAddresses],
    );

    return (
        <Screen
            header={<DynamicScreenHeader title="Received transaction" closeActionType="close" />}
        >
            <Box marginVertical="sp16">
                <VStack spacing="sp32">
                    <VStack spacing="sp12">
                        <TransactionOverviewSectionHeader
                            iconName="arrowUp"
                            title="From"
                            count={inputAddresses.length}
                        />
                        <AddressesListCard addresses={inputAddresses} />
                    </VStack>
                    <VStack spacing="sp12">
                        <TransactionOverviewSectionHeader
                            iconName="arrowDown"
                            title="To"
                            count={targetAddresses.length}
                        />
                        {A.isNotEmpty(changeAddresses) && (
                            <>
                                <OverviewSubheader title="Me" count={changeAddresses.length} />
                                <ChangeAddressesHeader addressesCount={changeAddresses.length} />
                                <AddressesListCard addresses={changeAddresses} />
                            </>
                        )}
                        <OverviewSubheader
                            title="Other recipients"
                            count={targetAddresses.length}
                        />
                        <AddressesListCard addresses={targetAddresses} />
                    </VStack>
                </VStack>
            </Box>
        </Screen>
    );
};
