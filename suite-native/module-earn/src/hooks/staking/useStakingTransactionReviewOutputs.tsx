import { useCallback } from 'react';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';
import { Translation, type TxKeyPath } from '@suite-native/intl';

import { type EarnFormDraftPrefix } from '../../types';

const titleTranslationId: Record<EarnFormDraftPrefix, TxKeyPath> = {
    stake: 'earn.earnStakeOutputItem.title',
    unstake: 'earn.earnUnstakeOutputItem.title',
    claim: 'earn.claimOutputItem.title',
};

const descriptionTranslationId: Record<EarnFormDraftPrefix, TxKeyPath> = {
    stake: 'earn.earnStakeOutputItem.description',
    unstake: 'earn.earnUnstakeOutputItem.description',
    claim: 'earn.claimOutputItem.description',
};

const everstakeDescriptionTranslationId: Record<
    Extract<EarnFormDraftPrefix, 'unstake' | 'claim'>,
    TxKeyPath
> = {
    unstake: 'earn.earnUnstakeOutputItem.descriptionEverstake',
    claim: 'earn.claimOutputItem.descriptionEverstake',
};

interface UseStakingTransactionReviewOutputsProps {
    account: Account | null;
    stakeType: EarnFormDraftPrefix;
}

export const useStakingTransactionReviewOutputs = ({
    account,
    stakeType,
}: UseStakingTransactionReviewOutputsProps) => {
    const getOutputTitle = useCallback(
        () => <Translation id={titleTranslationId[stakeType]} />,
        [stakeType],
    );

    const getOutputValue = useCallback(() => {
        if (!account) return null;

        const displaySymbol = getNetworkDisplaySymbol(account.symbol);

        const isEverstakeStaking =
            stakeType !== 'stake' && isSupportedEthStakingNetworkSymbol(account.symbol);

        return (
            <Text variant="body-sm">
                <Translation
                    id={
                        isEverstakeStaking
                            ? everstakeDescriptionTranslationId[stakeType]
                            : descriptionTranslationId[stakeType]
                    }
                    values={{ displaySymbol }}
                />
            </Text>
        );
    }, [account, stakeType]);

    return { getOutputTitle, getOutputValue };
};
