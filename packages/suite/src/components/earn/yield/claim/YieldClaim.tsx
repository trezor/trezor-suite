import { useMemo, useState } from 'react';

import { Translation } from '@suite/intl';
import { ChainAddressKey } from '@suite-common/earn-stablecoin-api';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Button, Card, Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { YieldRewardsList } from './YieldRewardsList';
import { useMerkleRewards } from '../../dashboard/yield/hooks/useMerkleRewards';
import { YieldFlowCompleteClaim } from '../common/YieldFlowCompleteClaim';

type YieldClaimProps = {
    account?: Account;
};

export const YieldClaim = ({ account }: YieldClaimProps) => {
    const [isClaimComplete, setIsClaimComplete] = useState(false);

    const merkleRewardsSources = useMemo(
        () => (account ? [{ networkSymbol: account.symbol, address: account.descriptor }] : []),
        [account],
    );

    const { merkleRewardsQuery } = useMerkleRewards(merkleRewardsSources);
    const { rewards } = merkleRewardsQuery.data;

    const claimableRewards = useMemo(() => {
        if (!account || !merkleRewardsQuery.isSuccess) return [];

        return Object.entries(rewards)
            .filter(([key]) => {
                const { address } = ChainAddressKey.parse(key);

                return address.toLowerCase() === account.descriptor.toLowerCase();
            })
            .flatMap(([, rewardList]) =>
                rewardList.filter(reward => new BigNumber(reward.claimable).gt(0)),
            );
    }, [account, merkleRewardsQuery.isSuccess, rewards]);

    if (!account) {
        return null;
    }

    if (isClaimComplete) {
        return (
            <Column width="100%" alignItems="center">
                <Column gap={24} width="100%" maxWidth={500}>
                    <YieldFlowCompleteClaim rewards={claimableRewards} />
                </Column>
            </Column>
        );
    }

    return (
        <Column width="100%" alignItems="center">
            <Column gap={24} width="100%" maxWidth={500}>
                <Text typographyStyle="headline-md">
                    <Translation id="TR_EARN_CLAIM_REWARDS" />
                </Text>

                <Card>
                    <Column gap={24}>
                        <Text typographyStyle="body-md-strong">
                            <Translation id="TR_STAKE_REWARDS" />
                        </Text>

                        <YieldRewardsList
                            rewards={claimableRewards}
                            isLoading={merkleRewardsQuery.isLoading}
                        />
                    </Column>
                </Card>

                {merkleRewardsQuery.isSuccess && claimableRewards.length > 0 && (
                    <Banner
                        intent="warning"
                        icon="warning"
                        description={<Translation id="TR_EARN_REWARDS_NETWORK_FEE_WARNING" />}
                    />
                )}

                <Button
                    size="large"
                    width="100%"
                    isDisabled={merkleRewardsQuery.isLoading || claimableRewards.length === 0}
                    onClick={() => setIsClaimComplete(true)}
                >
                    <Translation id="TR_EARN_YIELD_CLAIM" />
                </Button>
            </Column>
        </Column>
    );
};
