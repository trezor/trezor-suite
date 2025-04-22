import React from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';
import { getUnstakingPeriodInDays } from '@suite-common/wallet-utils';
import {
    Badge,
    CollapsibleBox,
    Column,
    Divider,
    Icon,
    IconName,
    List,
    Modal,
    Paragraph,
    Row,
    Text,
} from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite';
import { StakingInfo } from 'src/components/suite/StakingProcess/StakingInfo';
import { UnstakingInfo } from 'src/components/suite/StakingProcess/UnstakingInfo';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

interface StakingDetails {
    id: number;
    icon: IconName;
    translationId: TranslationKey;
}

const getStakingDetails = (networkType: NetworkType): StakingDetails[] => [
    {
        id: 0,
        icon: 'lockSimple',
        translationId: 'TR_STAKE_STAKED_AMOUNT_LOCKED',
    },
    {
        id: 1,
        icon: 'handCoins',
        translationId: 'TR_STAKE_REWARDS_EARN',
    },
    {
        id: 2,
        icon: 'arrowBendDoubleUpLeft',
        translationId:
            networkType === 'ethereum'
                ? 'TR_STAKE_ETH_UNSTAKING_TAKES'
                : 'TR_STAKE_SOL_UNSTAKING_TAKES',
    },
];

interface StakeInANutshellModalProps {
    onCancel: () => void;
}

export const StakeInANutshellModal = ({ onCancel }: StakeInANutshellModalProps) => {
    const account = useSelector(selectSelectedAccount);
    const dispatch = useDispatch();
    const { validatorWithdrawTime, validatorExitTime } = useSelector(state =>
        selectValidatorsQueueData(state, account?.symbol),
    );

    const unstakingPeriod = getUnstakingPeriodInDays({
        networkType: account?.networkType,
        validatorWithdrawTime,
        validatorExitTime,
    });

    const proceedToEverstakeModal = () => {
        onCancel();
        dispatch(openModal({ type: 'everstake' }));

        analytics.report({
            type: EventType.StakingStake,
            payload: {
                action: 'continue',
                step: 'stake-in-a-nutshell-modal',
                networkSymbol: account?.symbol,
            },
        });
    };

    const onCancelClick = () => {
        onCancel();

        analytics.report({
            type: EventType.StakingStake,
            payload: {
                action: 'cancel',
                step: 'stake-in-a-nutshell-modal',
                networkSymbol: account?.symbol,
            },
        });
    };

    const processes = [
        {
            heading: <Translation id="TR_STAKE_STAKING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE" />,
            content: <StakingInfo />,
        },
        {
            heading: <Translation id="TR_STAKE_UNSTAKING_PROCESS" />,
            badge: (
                <>
                    <Translation id="TR_TX_CONFIRMATIONS" values={{ confirmationsCount: 2 }} />{' '}
                    <Translation id="TR_TX_FEE" />
                </>
            ),
            content: <UnstakingInfo />,
        },
    ];

    if (!account) return null;

    return (
        <Modal
            heading={<Translation id="TR_STAKE_STAKING_IN_A_NUTSHELL" />}
            size="tiny"
            onCancel={onCancelClick}
            bottomContent={
                <Modal.Button onClick={proceedToEverstakeModal}>
                    <Translation id="TR_CONTINUE" />
                </Modal.Button>
            }
        >
            <List
                gap={spacings.lg}
                bulletGap={spacings.md}
                typographyStyle="hint"
                margin={{ top: spacings.xs }}
            >
                {getStakingDetails(account.networkType).map(({ id, icon, translationId }) => (
                    <List.Item key={id} bulletComponent={<Icon name={icon} variant="primary" />}>
                        <Paragraph variant="tertiary">
                            <Translation
                                id={translationId}
                                values={{
                                    networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                                    count: unstakingPeriod,
                                }}
                            />
                        </Paragraph>
                    </List.Item>
                ))}
            </List>
            <Divider margin={{ top: spacings.xl, bottom: spacings.md }} />
            <Column gap={spacings.lg}>
                {processes.map(({ heading, badge, content }, index) => (
                    <CollapsibleBox
                        key={index}
                        heading={
                            <Row gap={spacings.xs}>
                                <Text variant="tertiary">{heading}</Text>
                                <Badge size="tiny">{badge}</Badge>
                            </Row>
                        }
                        fillType="none"
                        paddingType="none"
                        hasDivider={false}
                    >
                        {content}
                    </CollapsibleBox>
                ))}
            </Column>
        </Modal>
    );
};
