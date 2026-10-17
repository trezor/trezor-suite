import { Translation, type TranslationKey } from '@suite/intl';
import { getResourceGain } from '@suite-common/wallet-core';
import { type TronResourceType } from '@suite-common/wallet-types';
import { Card, Column, Divider, Icon, Row, Text } from '@trezor/components';
import { CheckCircleFilledIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

import { useTronStakeContext } from '../TronStakeContext';
import { TronStakeInfoRow } from '../TronStakeInfoRow';
import {
    formatApr,
    getWeightedApr,
    parseVoteAllocations,
    parseVoteCount,
} from '../utils/voteUtils';
import { TronVoteAllocationTable } from '../vote/TronVoteAllocationTable';

const RESOURCE_LABEL: Record<TronResourceType, TranslationKey> = {
    bandwidth: 'TR_EARN_TRON_BANDWIDTH',
    energy: 'TR_EARN_TRON_ENERGY',
};

export const TronStakeSummaryCard = () => {
    const { account, form, representatives, actions } = useTronStakeContext();
    const { freeze } = actions;

    const voteAllocations = form.methods.getValues('voteAllocations');
    const allocations = voteAllocations.filter(({ votes }) => (parseVoteCount(votes) ?? 0) > 0);

    const tronResources = account.networkType === 'tron' ? account.misc.tronResources : undefined;
    const gain = freeze ? getResourceGain(freeze.amount, freeze.resourceType, tronResources) : null;

    const apr = getWeightedApr({
        allocations: parseVoteAllocations(voteAllocations),
        representatives: representatives.data,
    });

    return (
        <Column gap={16} alignItems="stretch">
            <Card
                type="contrast"
                paddingType="none"
                data-testid="@staking/tron-complete/summary-card"
            >
                <Column gap={0}>
                    <TronStakeInfoRow label={<Translation id="TR_EARN_YIELD_STATUS" />}>
                        <Row alignItems="center" gap={8}>
                            <Icon as={CheckCircleFilledIcon} intent="brand" />
                            <Text typographyStyle="body-md" intent="brand">
                                <Translation id="TR_EARN_YIELD_COMPLETED" />
                            </Text>
                        </Row>
                    </TronStakeInfoRow>

                    {freeze && (
                        <>
                            <Divider color="borderNeutral" margin={0} />

                            <TronStakeInfoRow label={<Translation id="TR_EARN_TRON_APR_LABEL" />}>
                                <Text
                                    typographyStyle="body-md-strong"
                                    data-testid="@staking/tron-complete/apr"
                                >
                                    {formatApr(apr)}
                                </Text>
                            </TronStakeInfoRow>

                            <Divider color="borderNeutral" margin={0} />

                            <TronStakeInfoRow
                                label={<Translation id="TR_EARN_TRON_EARNED_RESOURCE" />}
                            >
                                <Text
                                    typographyStyle="body-md-strong"
                                    data-testid="@staking/tron-complete/earned-resource"
                                >
                                    <Translation
                                        id={RESOURCE_LABEL[freeze.resourceType]}
                                        values={{ count: gain !== null ? Math.round(gain) : 0 }}
                                    />
                                </Text>
                            </TronStakeInfoRow>

                            <Divider color="borderNeutral" margin={0} />

                            <TronStakeInfoRow label={<Translation id="TR_EARN_TRON_SUPPLIED" />}>
                                <Row alignItems="center" gap={8}>
                                    <TokenIcon symbol={account.symbol} size={24} />
                                    <Column gap={2} alignItems="flex-end">
                                        <Text
                                            typographyStyle="body-md-strong"
                                            data-testid="@staking/tron-complete/supplied-amount"
                                        >
                                            <FormattedCryptoAmount
                                                value={freeze.amount}
                                                symbol={account.symbol}
                                            />
                                        </Text>
                                        <Text
                                            typographyStyle="body-sm"
                                            intent="neutral"
                                            priority="secondary"
                                        >
                                            <BaseCurrencyValue
                                                amount={freeze.amount}
                                                symbol={account.symbol}
                                                showApproximationIndicator
                                            />
                                        </Text>
                                    </Column>
                                </Row>
                            </TronStakeInfoRow>
                        </>
                    )}
                </Column>
            </Card>

            {allocations.length > 0 && (
                <Card paddingType="none" data-testid="@staking/tron-complete/vote-allocations">
                    <TronVoteAllocationTable
                        allocations={allocations}
                        representatives={representatives.data}
                    />
                </Card>
            )}
        </Column>
    );
};
