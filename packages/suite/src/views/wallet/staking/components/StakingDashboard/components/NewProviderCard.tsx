import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import {
    selectHasStakingAccountWarning,
    selectIsStakingAccountWithoutPool,
    selectStakeableStakingProductDescriptorBySymbol,
    useNetworkStakingRate,
} from '@suite-common/earn-staking';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Link, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { InfoIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { HELP_CENTER_ADA_STAKING_UPDATE_PROVIDER } from '@trezor/urls';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';
import { useStakingOperationSwitch } from '#src/hooks/earn/useStakingOperationSwitch';
import { useSelector } from '#src/hooks/suite/useSelector';

interface NewProviderCardProps {
    account: Account;
}

export const NewProviderCard = ({ account }: NewProviderCardProps) => {
    const { dispatch } = useServices(injectDispatch);
    const formatApyValue = useFormatApy();

    // The provider on offer: the product the network stakes on, not the one the account is on.
    const stakeableDescriptor = useSelector(state =>
        selectStakeableStakingProductDescriptorBySymbol(state, account.symbol),
    );

    const { isDisabled: isStakingDisabled, message: stakingMessageContent } =
        useStakingOperationSwitch(stakeableDescriptor?.id ?? null, 'stake');

    const { rate } = useNetworkStakingRate({ networkSymbol: account.symbol });

    const hasNoPool = useSelector(state => selectIsStakingAccountWithoutPool(state, account.key));
    const hasOutdatedProvider = useSelector(state =>
        selectHasStakingAccountWarning(state, account.key, 'outdated-provider'),
    );

    const title = hasOutdatedProvider
        ? 'TR_STAKING_NEW_PROVIDER_OUTDATED_TITLE'
        : 'TR_STAKING_NEW_PROVIDER_TITLE';
    const description = hasOutdatedProvider
        ? 'TR_STAKING_NEW_PROVIDER_OUTDATED_TEXT'
        : 'TR_STAKING_NEW_PROVIDER_TEXT';

    const displaySymbol = <AssetSymbol networkSymbol={account.symbol} />;

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
            intent={hasOutdatedProvider ? 'warning' : 'info'}
            title={
                <span data-testid="@staking/new-provider-card/header">
                    <Translation
                        id={hasNoPool ? 'TR_STAKING_NO_POOL_TITLE' : title}
                        values={{ apy: formatApyValue(rate) }}
                    />
                </span>
            }
            description={
                <span>
                    <span data-testid="@staking/new-provider-card/paragraph">
                        <Translation
                            id={hasNoPool ? 'TR_STAKING_NO_POOL_TEXT' : description}
                            values={{ apy: formatApyValue(rate), displaySymbol }}
                        />
                    </span>

                    {hasOutdatedProvider && (
                        <>
                            {' '}
                            <Link
                                href={HELP_CENTER_ADA_STAKING_UPDATE_PROVIDER}
                                data-testid="@staking/new-provider-card/learn-more"
                            >
                                <Translation id="TR_LEARN_MORE" />
                            </Link>
                        </>
                    )}
                </span>
            }
            rightContent={
                <Tooltip content={stakingMessageContent}>
                    <Banner.Button
                        onClick={openStakeInANutshellModal}
                        isDisabled={isStakingDisabled}
                        iconLeft={isStakingDisabled ? InfoIcon : undefined}
                        data-testid="@staking/new-provider-card/update-provider-button"
                    >
                        <Translation id="TR_EARN_UPDATE_PROVIDER" />
                    </Banner.Button>
                </Tooltip>
            }
        />
    );
};
