import { Translation, TranslationKey } from '@suite/intl';
import { StakingFlow } from '@suite-common/suite-types/src/staking';
import { NetworkType, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { CARDANO_ACTIVATION_PERIOD_DAYS } from '@suite-common/wallet-constants';
import { selectPoolStatsApyData, selectValidatorsQueueData } from '@suite-common/wallet-core';
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
import { spacings } from '@trezor/theme';

import { openModal } from 'src/actions/suite/modalActions';
import { StakingInfo } from 'src/components/suite/StakingProcess/StakingInfo';
import { UnstakingInfo } from 'src/components/suite/StakingProcess/UnstakingInfo';
import { stakingFlowToEventTypeMap } from 'src/constants/suite/staking';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useAnalytics } from 'src/support/useAnalytics';

interface StakingDetails {
    id: number;
    icon: IconName;
    translationId: TranslationKey;
}

const getStakingDetails = (flow: StakingFlow, networkType: NetworkType): StakingDetails[] => {
    if (flow === StakingFlow.UpdateProvider)
        return [
            {
                id: 0,
                icon: 'piggyBank',
                translationId: 'TR_STAKING_EARN_APY_WITH_EVERSTAKE',
            },
            {
                id: 1,
                icon: 'wallet',
                translationId: 'TR_STAKE_YOUR_FUNDS_STAY_ACCESSIBLE',
            },
            {
                id: 2,
                icon: 'handCoins',
                translationId: 'TR_STAKE_ALL_YOUR_FUNDS_IS_STAKED',
            },
        ];

    if (networkType === 'cardano')
        return [
            {
                id: 0,
                icon: 'wallet',
                translationId: 'TR_STAKE_YOUR_FUNDS_STAY_ACCESSIBLE',
            },
            {
                id: 1,
                icon: 'piggyBank',
                translationId: 'TR_STAKE_ALL_YOUR_FUNDS_IS_STAKED',
            },
            {
                id: 2,
                icon: 'scroll',
                translationId: 'TR_STAKE_RETURNABLE_DEPOSIT_IS_REQUIRED',
            },
        ];

    return [
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
};

interface StakeInANutshellModalProps {
    onCancel: () => void;
    flow: StakingFlow;
}

export const StakeInANutshellModal = ({ onCancel, flow }: StakeInANutshellModalProps) => {
    const analytics = useAnalytics();
    const account = useSelector(selectSelectedAccount);
    const dispatch = useDispatch();
    const { validatorWithdrawTime, validatorExitTime } = useSelector(state =>
        selectValidatorsQueueData(state, account?.symbol),
    );
    const apy = useSelector(state => selectPoolStatsApyData(state, account));

    const isCardano = account?.networkType === 'cardano';

    const unstakingPeriod = getUnstakingPeriodInDays({
        networkType: account?.networkType,
        validatorWithdrawTime,
        validatorExitTime,
    });

    const proceedToEverstakeModal = () => {
        onCancel();
        dispatch(openModal({ type: 'everstake', flow }));

        analytics.report({
            type: stakingFlowToEventTypeMap[flow],
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
            type: stakingFlowToEventTypeMap[flow],
            payload: {
                action: 'cancel',
                step: 'stake-in-a-nutshell-modal',
                networkSymbol: account?.symbol,
            },
        });
    };

    const processes = [
        {
            heading: (
                <Translation
                    id={
                        flow === StakingFlow.UpdateProvider
                            ? 'TR_STAKE_PROVIDER_UPDATE'
                            : 'TR_STAKE_STAKING_PROCESS'
                    }
                />
            ),
            badge: <Translation id="TR_TX_FEE" />,
            content: <StakingInfo flow={flow} />,
        },
        {
            heading: <Translation id="TR_STAKE_UNSTAKING_PROCESS" />,
            badge: (
                <>
                    {!isCardano && (
                        <Translation id="TR_TX_CONFIRMATIONS" values={{ confirmationsCount: 2 }} />
                    )}{' '}
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
            width={400}
            onCancel={onCancelClick}
            bottomContent={
                <Modal.Button
                    onClick={proceedToEverstakeModal}
                    data-testid="@modal/staking/continue-button"
                >
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
                {getStakingDetails(flow, account.networkType).map(({ id, icon, translationId }) => (
                    <List.Item key={id} bulletComponent={<Icon name={icon} variant="primary" />}>
                        <Paragraph variant="tertiary">
                            <Translation
                                id={translationId}
                                values={{
                                    networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                                    count: unstakingPeriod,
                                    apy,
                                    days: CARDANO_ACTIVATION_PERIOD_DAYS,
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
                                <Badge size="small">{badge}</Badge>
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
