import { selectFormattedAccountType, useAccoutsSelector } from '@suite-common/wallet-core';
import { Badge, Box, HStack, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, NetworkDisplaySymbolNameFormatter } from '@suite-native/formatters';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import {
    selectAPYByAccountKey,
    selectAPYBySymbol,
    useSelector as useNativeStakingSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CRYPTO_BALANCE_DECIMALS } from '../constants';
import { EarnItem } from '../types';

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

type EarnItemOverviewSectionProps = {
    stakedBalance: string | null;
} & EarnItem;

export const EarnItemOverviewSection = ({
    accountKey = '',
    symbol,
    stakedBalance,
    accountLabel,
}: EarnItemOverviewSectionProps) => {
    const { applyStyle } = useNativeStyles();

    const formattedAccountType = useAccoutsSelector(state =>
        selectFormattedAccountType(state, accountKey),
    );

    const apy = useNativeStakingSelector(state => selectAPYByAccountKey(state, accountKey));

    const fallbackApy = useNativeStakingSelector(state => selectAPYBySymbol(state, symbol));

    return (
        <HStack
            flex={1}
            justifyContent="space-between"
            alignItems="center"
            paddingHorizontal="sp16"
        >
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="sp16">
                    <CryptoIconWithNetwork symbol={symbol} />
                </Box>
                <Box style={applyStyle(accountDescriptionStyle)}>
                    <Text>
                        <NetworkDisplaySymbolNameFormatter value={symbol} />
                    </Text>
                    {accountKey && (
                        <HStack>
                            <Text color="textSubdued" variant="hint">
                                {accountLabel}
                            </Text>
                            {formattedAccountType && (
                                <Badge label={formattedAccountType} size="small" elevation="1" />
                            )}
                        </HStack>
                    )}
                </Box>
            </Box>
            <Box style={applyStyle(valuesContainerStyle)}>
                {accountKey && (
                    <CryptoAmountFormatter
                        value={stakedBalance}
                        symbol={symbol}
                        decimals={CRYPTO_BALANCE_DECIMALS}
                        color="textDefault"
                    />
                )}
                <Text
                    variant={accountKey ? 'hint' : 'body'}
                    color={accountKey ? 'textSubdued' : 'textDefault'}
                >{`${apy || fallbackApy}% p.a.`}</Text>
            </Box>
        </HStack>
    );
};
