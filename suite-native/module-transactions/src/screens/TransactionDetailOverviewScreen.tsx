import { ReactNode, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';
import { RouteProp, useRoute } from '@react-navigation/native';

import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { TransactionsRootState } from '@suite-common/wallet-core';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { AddressFormatter } from '@suite-native/formatters';
import { Icon, IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
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

const AddressRow = ({ address }: { address: string }) => {
    const { applyStyle } = useNativeStyles();

    return (
        <HStack
            paddingHorizontal="sp16"
            paddingVertical="sp12"
            alignItems="center"
            style={applyStyle(addressCardStyle)}
        >
            <AddressFormatter value={address} />
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
    title: ReactNode;
    count: number;
}) => (
    <HStack spacing="sp12" alignItems="center">
        <Icon name={iconName} size="mediumLarge" />
        <Text variant="highlight">
            {title} <Text color="textSubdued">· {count}</Text>
        </Text>
    </HStack>
);

const OverviewSubheader = ({ title, count }: { title: ReactNode; count: number }) => (
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
                            title={
                                <Translation id="transactions.transactionOverviewScreen.fromCard.title" />
                            }
                            count={inputAddresses.length}
                        />
                        <AddressesListCard addresses={inputAddresses} />
                    </VStack>
                    <VStack spacing="sp12">
                        <TransactionOverviewSectionHeader
                            iconName="arrowDown"
                            title={
                                <Translation id="transactions.transactionOverviewScreen.toCard.title" />
                            }
                            count={outputAddresses.length}
                        />
                        {A.isNotEmpty(changeAddresses) && (
                            <>
                                <OverviewSubheader
                                    title={
                                        <Translation id="transactions.transactionOverviewScreen.toCard.meTitle" />
                                    }
                                    count={changeAddresses.length}
                                />
                                <ChangeAddressesHeader addressesCount={changeAddresses.length} />
                                <AddressesListCard addresses={changeAddresses} />
                            </>
                        )}
                        <OverviewSubheader
                            title={
                                <Translation id="transactions.transactionOverviewScreen.toCard.otherRecipients" />
                            }
                            count={targetAddresses.length}
                        />
                        <AddressesListCard addresses={targetAddresses} />
                    </VStack>
                </VStack>
            </Box>
        </Screen>
    );
};
