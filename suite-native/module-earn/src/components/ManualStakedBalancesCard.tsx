import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Card, PressableOpacity, Text, useBottomSheetModal } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    selectStakedBalanceByAccountKey,
    selectTronAvailableVotingPowerByAccountKey,
    selectTronTotalVotingPowerByAccountKey,
    useSelector,
} from '@suite-native/staking';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ApyValue } from './ApyValue';
import { TronStakingVotesBottomSheet } from './TronStakingVotesBottomSheet';

const stakingItemStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: utils.spacings.sp4,
    paddingBottom: utils.spacings.sp8,
}));

const stakingWrapperStyle = prepareNativeStyle(utils => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingBottom: utils.spacings.sp16,
}));

const separatorStyle = prepareNativeStyle(utils => ({
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.borderNeutral,
}));

const votesValueStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: utils.spacings.sp4,
}));

const remainingVotesStyle = prepareNativeStyle(utils => ({
    textDecorationLine: 'underline',
    marginLeft: utils.spacings.sp4,
}));

type ManualStakedBalancesCardProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol | null;
    rewardsBalance: string | null;
    apy: number | null;
    handleToggleBottomSheet: (value: boolean) => void;
};

const CRYPTO_BALANCE_DECIMALS = 5;

export const ManualStakedBalancesCard = ({
    accountKey,
    symbol,
    rewardsBalance,
    apy,
    handleToggleBottomSheet,
}: ManualStakedBalancesCardProps) => {
    const { applyStyle } = useNativeStyles();
    const tronVotesModal = useBottomSheetModal();

    const stakedBalance = useSelector(state => selectStakedBalanceByAccountKey(state, accountKey));

    const isTron = symbol === 'trx';

    const totalVotingPower = useSelector(state =>
        selectTronTotalVotingPowerByAccountKey(state, accountKey),
    );
    const availableVotingPower = useSelector(state =>
        selectTronAvailableVotingPowerByAccountKey(state, accountKey),
    );

    if (!symbol) return null;

    const rewardsTitle = ['sol', 'dsol'].includes(symbol) ? (
        <Translation id="earn.rewardsPerEpoch" />
    ) : (
        <Translation id="earn.rewards" />
    );

    return (
        <>
            <PressableOpacity onPress={() => handleToggleBottomSheet(true)}>
                <Card>
                    <Box style={applyStyle(stakingWrapperStyle)}>
                        <Box flex={1}>
                            <Box style={applyStyle(stakingItemStyle)}>
                                <Icon name="lock" color="contentSecondary" size="medium" />
                                <Text color="contentSecondary" variant="body-xs">
                                    <Translation id="earn.staked" />
                                </Text>
                            </Box>
                            <CryptoAmountFormatter
                                value={stakedBalance}
                                symbol={symbol}
                                decimals={CRYPTO_BALANCE_DECIMALS}
                                color="contentPrimary"
                                variant="headline-sm"
                            />
                            <Box flexDirection="row">
                                <Text color="contentSecondary">≈</Text>
                                <CryptoToFiatAmountFormatter
                                    value={stakedBalance}
                                    symbol={symbol}
                                    color="contentSecondary"
                                    isBalance
                                />
                            </Box>
                        </Box>

                        <Box flex={1}>
                            <Box style={applyStyle(stakingItemStyle)}>
                                <Icon name="plusCircle" color="contentSecondary" size="medium" />
                                <Text color="contentSecondary" variant="body-xs">
                                    {rewardsTitle}
                                </Text>
                            </Box>
                            <CryptoAmountFormatter
                                value={rewardsBalance}
                                symbol={symbol}
                                decimals={CRYPTO_BALANCE_DECIMALS}
                                color="contentBrand"
                                variant="headline-sm"
                            />
                            <Box flexDirection="row">
                                <Text color="contentSecondary">≈</Text>
                                <CryptoToFiatAmountFormatter
                                    value={rewardsBalance}
                                    symbol={symbol}
                                    color="contentSecondary"
                                    isBalance
                                />
                            </Box>
                        </Box>
                    </Box>

                    <Box style={applyStyle(separatorStyle)} />

                    <Box
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="space-between"
                        paddingTop="sp16"
                    >
                        <Text color="contentSecondary">
                            <Translation id={isTron ? 'earn.apr' : 'earn.apy'} />
                        </Text>

                        <Text>
                            <ApyValue apy={apy} />
                        </Text>
                    </Box>

                    {isTron && (
                        <Box paddingTop="sp16">
                            <Box style={applyStyle(separatorStyle)} />

                            <Box
                                flexDirection="row"
                                alignItems="center"
                                justifyContent="space-between"
                                paddingTop="sp16"
                            >
                                <Text color="contentSecondary">
                                    <Translation id="earn.tron.votes" />
                                </Text>

                                <Box style={applyStyle(votesValueStyle)}>
                                    {availableVotingPower === '0' ? (
                                        <Text variant="body-sm-strong">
                                            <Translation
                                                id="earn.tron.allVotesUsed"
                                                values={{ count: totalVotingPower }}
                                            />
                                        </Text>
                                    ) : (
                                        <PressableOpacity onPress={tronVotesModal.openModal}>
                                            <Box flexDirection="row" alignItems="center">
                                                <Icon
                                                    name="warning"
                                                    color="contentWarning"
                                                    size="medium"
                                                />

                                                <Text
                                                    style={applyStyle(remainingVotesStyle)}
                                                    variant="body-sm-strong"
                                                    color="contentWarning"
                                                >
                                                    <Translation
                                                        id="earn.tron.votesRemaining"
                                                        values={{ count: availableVotingPower }}
                                                    />
                                                </Text>
                                            </Box>
                                        </PressableOpacity>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Card>
            </PressableOpacity>

            <TronStakingVotesBottomSheet
                ref={tronVotesModal.bottomSheetRef}
                onClose={tronVotesModal.closeModal}
            />
        </>
    );
};
