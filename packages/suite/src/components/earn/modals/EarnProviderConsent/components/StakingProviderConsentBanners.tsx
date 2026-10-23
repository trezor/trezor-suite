import { Translation, type TranslationKey } from '@suite/intl';
import { EarnFlow, type StakeModalFlow } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    hasCardanoLiveVoteDelegation,
    isCardanoStakedWithFiveBinaries,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isStakingNetworkType } from '@suite-common/wallet-utils';
import { Banner } from '@trezor/components';
import { FileFilledIcon, ShieldWarningFilledIcon } from '@trezor/icons';
import { exhaustive } from '@trezor/type-utils';

interface StakingProviderConsentBannersProps {
    account: Account;
    flow: StakeModalFlow;
}

export const StakingProviderConsentBanners = ({
    account,
    flow,
}: StakingProviderConsentBannersProps) => {
    const { networkType } = account;
    const displaySymbol = getNetworkDisplaySymbol(account.symbol);

    if (!isStakingNetworkType(networkType)) return null;

    switch (networkType) {
        case 'ethereum':
            return (
                <>
                    <Banner
                        icon={FileFilledIcon}
                        intent="info"
                        description={
                            <Translation
                                id="TR_EARN_STAKE_EVERSTAKE_MANAGES"
                                values={{
                                    networkDisplaySymbol: displaySymbol,
                                    t: text => <strong>{text}</strong>,
                                }}
                            />
                        }
                    />
                    <Banner
                        icon={ShieldWarningFilledIcon}
                        intent="info"
                        description={<Translation id="TR_EARN_STAKE_TREZOR_NO_LIABILITY" />}
                    />
                </>
            );
        case 'cardano': {
            const keepsCurrentVote =
                !isCardanoStakedWithFiveBinaries(account) && hasCardanoLiveVoteDelegation(account);
            let votingMessage: TranslationKey = 'TR_EARN_CARDANO_STAKE_STAYS_IN_WALLET';
            if (flow === EarnFlow.UpdateProvider) {
                votingMessage = keepsCurrentVote
                    ? 'TR_EARN_CARDANO_UPDATE_KEEP_CURRENT_VOTE'
                    : 'TR_EARN_CARDANO_UPDATE_ABSTAIN';
            }

            return (
                <>
                    <Banner
                        icon={FileFilledIcon}
                        intent="info"
                        description={
                            <Translation
                                id="TR_EARN_BY_STAKING_YOU_CAN_EARN_REWARDS"
                                values={{
                                    networkDisplaySymbol: displaySymbol,
                                    t: text => <strong>{text}</strong>,
                                }}
                            />
                        }
                    />
                    <Banner
                        icon={ShieldWarningFilledIcon}
                        intent="info"
                        description={
                            <Translation id={votingMessage} values={{ symbol: displaySymbol }} />
                        }
                    />
                </>
            );
        }
        case 'solana':
            return (
                <>
                    <Banner
                        icon={FileFilledIcon}
                        intent="info"
                        description={
                            <Translation
                                id="TR_EARN_BY_STAKING_YOU_CAN_EARN_REWARDS"
                                values={{
                                    networkDisplaySymbol: displaySymbol,
                                    t: text => <strong>{text}</strong>,
                                }}
                            />
                        }
                    />
                    <Banner
                        icon={ShieldWarningFilledIcon}
                        intent="info"
                        description={
                            <Translation
                                id="TR_EARN_SECURELY_DELEGATE_TO_EVERSTAKE"
                                values={{ symbol: displaySymbol }}
                            />
                        }
                    />
                </>
            );
        case 'tron':
            return null;
        default:
            return exhaustive(networkType);
    }
};
