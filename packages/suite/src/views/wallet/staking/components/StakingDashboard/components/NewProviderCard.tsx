import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { useDispatch } from '@suite-common/redux-utils';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { isCardanoStakedWithFiveBinaries, selectPoolStatsApy } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { formatApyValue } from 'src/components/earn/utils/earnApyUtils';
import { useSelector } from 'src/hooks/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

interface NewProviderCardProps {
    account: Account;
}

export const NewProviderCard = ({ account }: NewProviderCardProps) => {
    const dispatch = useDispatch();

    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(account?.symbol);

    const apy = useSelector(state => selectPoolStatsApy(state, { networkSymbol: account.symbol }));

    const isStakedWithFiveBinaries = isCardanoStakedWithFiveBinaries(account);

    const displaySymbol = account?.symbol ? getNetworkDisplaySymbol(account.symbol) : '';

    const openStakeInANutshellModal = () => {
        if (!isStakingDisabled) {
            dispatch(
                openModal({
                    type: 'earn-in-a-nutshell',
                    flow: EarnFlow.UpdateProvider,
                    provider: EarnProvider.Everstake,
                    account,
                    analyticsStep: 'staking-dashboard',
                }),
            );
        }
    };

    return (
        <Banner
            icon
            intent={isStakedWithFiveBinaries ? 'warning' : 'info'}
            title={
                <Translation
                    id={
                        isStakedWithFiveBinaries
                            ? 'TR_STAKING_NEW_PROVIDER_OUTDATED_TITLE'
                            : 'TR_STAKING_NEW_PROVIDER_TITLE'
                    }
                    values={{ apy: formatApyValue(apy) }}
                />
            }
            description={
                <Translation
                    id={
                        isStakedWithFiveBinaries
                            ? 'TR_STAKING_NEW_PROVIDER_OUTDATED_TEXT'
                            : 'TR_STAKING_NEW_PROVIDER_TEXT'
                    }
                    values={{ apy: formatApyValue(apy), displaySymbol }}
                />
            }
            rightContent={
                <Tooltip content={stakingMessageContent}>
                    <Banner.Button
                        onClick={openStakeInANutshellModal}
                        isDisabled={isStakingDisabled}
                        iconLeft={isStakingDisabled ? InfoIcon : undefined}
                        data-testid="@wallet/staking/empty-card/start-staking-button"
                    >
                        <Translation id="TR_EARN_UPDATE_PROVIDER" />
                    </Banner.Button>
                </Tooltip>
            }
        />
    );
};
