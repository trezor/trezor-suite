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
import { formatApr, resolveVotedRepresentativeAddress } from '../voteUtils';

const RESOURCE_LABEL: Record<TronResourceType, TranslationKey> = {
    bandwidth: 'TR_EARN_TRON_BANDWIDTH',
    energy: 'TR_EARN_TRON_ENERGY',
};

export const TronStakeSummaryCard = () => {
    const { account, form, representatives } = useTronStakeContext();
    const { amount, resourceType } = form.methods.getValues();

    const tronResources = account.networkType === 'tron' ? account.misc.tronResources : undefined;
    const gain = getResourceGain(amount, resourceType, tronResources);

    const votedAddress = resolveVotedRepresentativeAddress(form.methods.getValues());
    const apr = (representatives.data ?? []).find(({ address }) => address === votedAddress)?.apr;

    return (
        <Card type="contrast" paddingType="none">
            <Column gap={0}>
                <TronStakeInfoRow label={<Translation id="TR_EARN_YIELD_STATUS" />}>
                    <Row alignItems="center" gap={8}>
                        <Icon as={CheckCircleFilledIcon} intent="brand" />
                        <Text typographyStyle="body-md" intent="brand">
                            <Translation id="TR_EARN_YIELD_COMPLETED" />
                        </Text>
                    </Row>
                </TronStakeInfoRow>

                <Divider color="borderNeutral" margin={0} />

                <TronStakeInfoRow label={<Translation id="TR_EARN_TRON_APR_LABEL" />}>
                    <Text typographyStyle="body-md-strong">{formatApr(apr)}</Text>
                </TronStakeInfoRow>

                <Divider color="borderNeutral" margin={0} />

                <TronStakeInfoRow label={<Translation id="TR_EARN_TRON_EARNED_RESOURCE" />}>
                    <Text typographyStyle="body-md-strong">
                        <Translation
                            id={RESOURCE_LABEL[resourceType]}
                            values={{ count: gain !== null ? Math.round(gain) : 0 }}
                        />
                    </Text>
                </TronStakeInfoRow>

                <Divider color="borderNeutral" margin={0} />

                <TronStakeInfoRow label={<Translation id="TR_EARN_TRON_SUPPLIED" />}>
                    <Row alignItems="center" gap={8}>
                        <TokenIcon symbol={account.symbol} size={24} />
                        <Column gap={2} alignItems="flex-end">
                            <Text typographyStyle="body-md-strong">
                                <FormattedCryptoAmount value={amount} symbol={account.symbol} />
                            </Text>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <BaseCurrencyValue
                                    amount={amount}
                                    symbol={account.symbol}
                                    showApproximationIndicator
                                />
                            </Text>
                        </Column>
                    </Row>
                </TronStakeInfoRow>
            </Column>
        </Card>
    );
};
