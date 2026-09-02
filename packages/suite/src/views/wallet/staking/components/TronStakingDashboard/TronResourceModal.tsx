import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { type Account, type TronResourceType } from '@suite-common/wallet-types';
import {
    getResourceGain,
    getTronResources,
    getTronStakingInfo,
    sunToTrx,
} from '@suite-common/wallet-utils';
import { Button, Card, Column, Divider, Icon, Modal, Row, Text, Tooltip } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';

import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import {
    TronResourceBreakdownRow,
    type TronResourceBreakdownRowProps,
} from './TronResourceBreakdownRow';

interface TronResourceModalProps {
    account: Account;
    resourceType: TronResourceType;
    onClose: () => void;
}

export const TronResourceModal = ({ account, resourceType, onClose }: TronResourceModalProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const resources = getTronResources(account);
    const stakingInfo = getTronStakingInfo(account);
    const isEnergy = resourceType === 'energy';

    const { isStakingDisabled, stakingMessageContent } = useMessageSystemStaking(account.symbol);

    const freeBandwidth = resources?.totalFreeBandwidth ?? 0;
    const stakedBandwidth = resources?.totalStakedBandwidth ?? 0;
    const availableFreeBandwidth = resources?.availableFreeBandwidth ?? 0;
    const availableStakedBandwidth = resources?.availableStakedBandwidth ?? 0;

    const totalEnergy = resources?.totalEnergy ?? 0;
    const availableEnergy = resources?.availableEnergy ?? 0;

    const delegatedSun = isEnergy
        ? (stakingInfo?.delegatedBalanceEnergy ?? '0')
        : (stakingInfo?.delegatedBalanceBandwidth ?? '0');
    const delegatedTrx = sunToTrx(delegatedSun, account.symbol);
    const delegatedToOthers = Math.round(
        getResourceGain(delegatedTrx, resourceType, resources) ?? 0,
    );

    const rows: TronResourceBreakdownRowProps[] = isEnergy
        ? [
              { label: 'TR_EARN_TRON_RESOURCE_FROM_STAKING', value: totalEnergy },
              {
                  label: 'TR_EARN_TRON_RESOURCE_DELEGATED_TO_OTHERS',
                  value: delegatedToOthers,
                  isDeduction: true,
              },
          ]
        : [
              {
                  label: 'TR_EARN_TRON_RESOURCE_FREE',
                  value: freeBandwidth,
                  tooltip: 'TR_EARN_TRON_FREE_BANDWIDTH_TOOLTIP',
              },
              { label: 'TR_EARN_TRON_RESOURCE_FROM_STAKING', value: stakedBandwidth },
              {
                  label: 'TR_EARN_TRON_RESOURCE_DELEGATED_TO_OTHERS',
                  value: delegatedToOthers,
                  isDeduction: true,
              },
          ];

    const hasStakedBandwidth = stakedBandwidth > 0;
    const formatBandwidthValue = (free: number, staked: number) =>
        hasStakedBandwidth ? `${free} + ${staked}` : `${free}`;

    const total = isEnergy
        ? `${totalEnergy}`
        : formatBandwidthValue(freeBandwidth, stakedBandwidth);
    const available = isEnergy
        ? `${availableEnergy}`
        : formatBandwidthValue(availableFreeBandwidth, availableStakedBandwidth);

    const goToFreeze = () => {
        if (isStakingDisabled) {
            return;
        }

        dispatch(
            gotoThunk({
                routeName: 'earn-tron-stake',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
        onClose();

        analytics.report({
            type: events.stakingStakeEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <Modal
            width={400}
            heading={
                <Translation
                    id={isEnergy ? 'TR_EARN_TRON_MY_ENERGY' : 'TR_EARN_TRON_MY_BANDWIDTH'}
                />
            }
            onCancel={onClose}
            bottomContent={
                <Row gap={8}>
                    <Tooltip content={stakingMessageContent}>
                        <Button
                            intent="brand"
                            priority="primary"
                            onClick={goToFreeze}
                            isDisabled={isStakingDisabled}
                        >
                            <Translation id="TR_EARN_TRON_GET_MORE" />
                        </Button>
                    </Tooltip>

                    <Button intent="neutral" priority="secondary" onClick={onClose}>
                        <Translation id="TR_CLOSE" />
                    </Button>
                </Row>
            }
        >
            <Column gap={12} alignItems="stretch">
                <Card>
                    <Column gap={12} alignItems="stretch">
                        {rows.map(row => (
                            <TronResourceBreakdownRow key={row.label} {...row} />
                        ))}

                        <Divider margin={{}} />

                        <Column gap={4} alignItems="stretch">
                            <Row justifyContent="space-between">
                                <Text typographyStyle="body-md-strong">
                                    <Translation
                                        id={
                                            isEnergy
                                                ? 'TR_EARN_TRON_TOTAL_ENERGY'
                                                : 'TR_EARN_TRON_TOTAL_BANDWIDTH'
                                        }
                                    />
                                </Text>
                                <Text typographyStyle="body-md-strong">{total}</Text>
                            </Row>
                            <Row justifyContent="space-between">
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_EARN_TRON_AVAILABLE_NOW" />
                                </Text>
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    {available}
                                </Text>
                            </Row>
                        </Column>
                    </Column>
                </Card>

                <Row gap={8} alignItems="center">
                    <Icon as={InfoIcon} size={20} intent="neutral" priority="secondary" />
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        <Translation
                            id={
                                isEnergy
                                    ? 'TR_EARN_TRON_ENERGY_BALANCE_NOTE'
                                    : 'TR_EARN_TRON_BANDWIDTH_BALANCE_NOTE'
                            }
                        />
                    </Text>
                </Row>
            </Column>
        </Modal>
    );
};
