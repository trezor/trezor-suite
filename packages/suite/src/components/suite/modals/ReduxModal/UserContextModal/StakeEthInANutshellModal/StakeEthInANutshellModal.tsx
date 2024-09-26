import {
    Icon,
    IconName,
    Paragraph,
    NewModal,
    Badge,
    List,
    Column,
    Row,
    Text,
    Divider,
    CollapsibleBox,
} from '@trezor/components';
import { Translation } from 'src/components/suite';
import { TranslationKey } from '@suite-common/intl-types';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { spacings } from '@trezor/theme';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { getUnstakingPeriodInDays } from 'src/utils/suite/stake';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';
import { StakingInfo } from './StakingInfo';
import { UnstakingInfo } from './UnstakingInfo';

interface StakingDetails {
    id: number;
    icon: IconName;
    translationId: TranslationKey;
}

const STAKING_DETAILS: StakingDetails[] = [
    {
        id: 0,
        icon: 'lockSimple',
        translationId: 'TR_STAKE_STAKED_ETH_AMOUNT_LOCKED',
    },
    {
        id: 1,
        icon: 'handCoins',
        translationId: 'TR_STAKE_ETH_REWARDS_EARN',
    },
    {
        id: 2,
        icon: 'arrowBendDoubleUpLeft',
        translationId: 'TR_STAKE_UNSTAKING_TAKES',
    },
];

interface StakeEthInANutshellModalProps {
    onCancel: () => void;
}

export const StakeEthInANutshellModal = ({ onCancel }: StakeEthInANutshellModalProps) => {
    const account = useSelector(selectSelectedAccount);
    const dispatch = useDispatch();
    const { validatorWithdrawTime } = useSelector(state =>
        selectValidatorsQueueData(state, account?.symbol),
    );

    const unstakingPeriod = getUnstakingPeriodInDays(validatorWithdrawTime);

    const proceedToEverstakeModal = () => {
        onCancel();
        dispatch(openModal({ type: 'everstake' }));
    };

    const processes = [
        {
            heading: <Translation id="TR_STAKE_STAKING_PROCESS" />,
            badge: <Translation id="TR_TX_FEE" />,
            content: <StakingInfo account={account} />,
        },
        {
            heading: <Translation id="TR_STAKE_UNSTAKING_PROCESS" />,
            badge: (
                <>
                    <Translation id="TR_TX_CONFIRMATIONS" values={{ confirmationsCount: 2 }} />{' '}
                    <Translation id="TR_TX_FEE" />
                </>
            ),
            content: <UnstakingInfo account={account} />,
        },
    ];

    return (
        <NewModal
            heading={<Translation id="TR_STAKE_STAKING_IN_A_NUTSHELL" />}
            size="tiny"
            onCancel={onCancel}
            bottomContent={
                <NewModal.Button onClick={proceedToEverstakeModal}>
                    <Translation id="TR_CONTINUE" />
                </NewModal.Button>
            }
        >
            <List
                gap={spacings.lg}
                bulletGap={spacings.md}
                typographyStyle="hint"
                margin={{ top: spacings.xs }}
            >
                {STAKING_DETAILS.map(({ id, icon, translationId }) => (
                    <List.Item key={id} bulletComponent={<Icon name={icon} variant="primary" />}>
                        <Paragraph variant="tertiary">
                            <Translation
                                id={translationId}
                                values={{
                                    symbol: account?.symbol.toUpperCase(),
                                    count: unstakingPeriod,
                                }}
                            />
                        </Paragraph>
                    </List.Item>
                ))}
            </List>
            <Divider margin={{ top: spacings.xl, bottom: spacings.md }} />
            <Column alignItems="stretch" gap={spacings.lg}>
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
                        <List isOrdered bulletGap={spacings.sm} gap={spacings.md}>
                            {content}
                        </List>
                    </CollapsibleBox>
                ))}
            </Column>
        </NewModal>
    );
};
