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
    getRepresentativeName,
    getWeightedApr,
    parseVoteAllocations,
    parseVoteCount,
} from '../utils/voteUtils';
import { TronRepresentativeApr } from '../vote/TronRepresentativeApr';

const RESOURCE_LABEL: Record<TronResourceType, TranslationKey> = {
    bandwidth: 'TR_EARN_TRON_BANDWIDTH',
    energy: 'TR_EARN_TRON_ENERGY',
};

export const TronStakeSummaryCard = () => {
    // React Compiler: `getValues` keeps one identity for the form's whole life, so a compiled
    // render-time read of it freezes on the first render. Remove once these reads move to
    // `useWatch` or out of render.
    'use no memo';

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
        <Card type="contrast" paddingType="none" data-testid="@staking/tron-complete/summary-card">
            <Column gap={0}>
                <TronStakeInfoRow label={<Translation id="TR_EARN_YIELD_STATUS" />}>
                    <Row alignItems="center" gap={8}>
                        <Icon as={CheckCircleFilledIcon} intent="brand" />
                        <Text typographyStyle="body-md" intent="brand">
                            <Translation id="TR_EARN_YIELD_COMPLETED" />
                        </Text>
                    </Row>
                </TronStakeInfoRow>

                {(freeze || allocations.length > 0) && (
                    <>
                        <Divider color="borderNeutral" margin={0} />
                        <Column gap={12} padding={{ vertical: 16, horizontal: 20 }}>
                            {allocations.length > 0 ? (
                                <Row justifyContent="flex-end">
                                    <Text typographyStyle="body-md">
                                        <Translation id="TR_EARN_TRON_APR_LABEL" />
                                    </Text>
                                </Row>
                            ) : (
                                freeze && (
                                    <Row justifyContent="space-between" alignItems="center">
                                        <Text typographyStyle="body-md">
                                            <Translation id="TR_EARN_TRON_APR_LABEL" />
                                        </Text>
                                        <Text
                                            typographyStyle="body-md-strong"
                                            data-testid="@staking/tron-complete/apr"
                                        >
                                            {formatApr(apr)}
                                        </Text>
                                    </Row>
                                )
                            )}

                            {allocations.length > 0 && (
                                <Column
                                    gap={12}
                                    data-testid="@staking/tron-complete/vote-allocations"
                                >
                                    {allocations.map(({ address, votes }) => (
                                        <Row
                                            key={address}
                                            justifyContent="space-between"
                                            alignItems="center"
                                            gap={16}
                                            data-testid={`@staking/tron-vote/allocation-row/${address}`}
                                        >
                                            <Column gap={2} flex={1} minWidth={0}>
                                                <Text
                                                    typographyStyle="body-md"
                                                    overflowWrap="anywhere"
                                                    data-testid="@staking/tron-representative/name"
                                                >
                                                    {getRepresentativeName(
                                                        address,
                                                        representatives.data,
                                                    ) ?? address}
                                                </Text>
                                                <Text
                                                    typographyStyle="body-sm"
                                                    intent="neutral"
                                                    priority="secondary"
                                                    data-testid="@staking/tron-vote/allocation-row-votes"
                                                >
                                                    <Translation
                                                        id="TR_TRON_TX_VOTED_VOTES"
                                                        values={{ votes: Number(votes) }}
                                                    />
                                                </Text>
                                            </Column>
                                            <Text
                                                typographyStyle="body-md-strong"
                                                data-testid="@staking/tron-vote/allocation-row-apr"
                                            >
                                                <TronRepresentativeApr
                                                    address={address}
                                                    representatives={representatives.data}
                                                />
                                            </Text>
                                        </Row>
                                    ))}
                                </Column>
                            )}
                        </Column>
                    </>
                )}

                {freeze && (
                    <>
                        <Divider color="borderNeutral" margin={0} />
                        <TronStakeInfoRow label={<Translation id="TR_EARN_TRON_EARNED_RESOURCE" />}>
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
    );
};
