import { useSelector } from 'react-redux';

import {
    selectFormattedAccountType,
    selectHasRunningDiscovery,
    useAccountsSelector,
} from '@suite-common/wallet-core';
import { Badge, Box, BoxSkeleton, HStack, Text } from '@suite-native/atoms';
import { NetworkDisplaySymbolNameFormatter } from '@suite-native/formatters';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import {
    selectAPYByAccountKey,
    selectAPYBySymbol,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { type EarnPromoItem } from '../types';

const accountDescriptionStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

const valuesContainerStyle = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: utils.spacings.sp8,
}));

type EarnItemSecondaryDescriptionProps = {
    accountKey: EarnPromoItem['accountKey'];
    accountLabel: EarnPromoItem['accountLabel'];
    formattedAccountType: string | null;
    item: EarnPromoItem;
};

const EarnItemSecondaryDescription = ({
    accountKey,
    accountLabel,
    formattedAccountType,
    item,
}: EarnItemSecondaryDescriptionProps) => {
    if (accountKey) {
        return (
            <HStack>
                <Text color="textSubdued" variant="body-sm">
                    {accountLabel}
                </Text>
                {formattedAccountType && (
                    <Badge label={formattedAccountType} size="small" elevation="1" />
                )}
            </HStack>
        );
    }

    if (item.type === 'stablecoin-yield') {
        return (
            <Text color="textSubdued" variant="body-sm">
                <NetworkDisplaySymbolNameFormatter value={item.networkSymbol} />
            </Text>
        );
    }

    return null;
};

export const EarnItemOverviewSection = (item: EarnPromoItem) => {
    const { applyStyle } = useNativeStyles();

    const { accountKey, accountLabel } = item;

    const formattedAccountType = useAccountsSelector(state =>
        selectFormattedAccountType(state, accountKey),
    );

    const apy = useNativeStakingSelector(state => selectAPYByAccountKey(state, accountKey));
    const fallbackApy = useNativeStakingSelector(state =>
        item.type === 'staking' ? selectAPYBySymbol(state, item.symbol) : null,
    );

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const apyValue = item.type === 'staking' ? (apy ?? fallbackApy) : item.apy;

    const iconProps =
        item.type === 'staking'
            ? { symbol: item.symbol }
            : { symbol: item.networkSymbol, contractAddress: item.contractAddress };

    return (
        <HStack
            flex={1}
            justifyContent="space-between"
            alignItems="center"
            paddingHorizontal="sp16"
        >
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="sp16">
                    <CryptoIconWithNetwork {...iconProps} />
                </Box>
                <Box style={applyStyle(accountDescriptionStyle)}>
                    <Text>
                        {item.type === 'staking' ? (
                            <NetworkDisplaySymbolNameFormatter value={item.symbol} />
                        ) : (
                            item.vaultName
                        )}
                    </Text>
                    <EarnItemSecondaryDescription
                        accountKey={accountKey}
                        accountLabel={accountLabel}
                        formattedAccountType={formattedAccountType}
                        item={item}
                    />
                </Box>
            </Box>

            {isDiscoveryRunning ? (
                <BoxSkeleton width={70} height={20} />
            ) : (
                <Box style={applyStyle(valuesContainerStyle)}>
                    {apyValue != null && (
                        <Text
                            variant={accountKey ? 'body-sm' : 'body-md'}
                            color={accountKey ? 'textSubdued' : 'textDefault'}
                        >{`${apyValue}% APY`}</Text>
                    )}
                </Box>
            )}
        </HStack>
    );
};
