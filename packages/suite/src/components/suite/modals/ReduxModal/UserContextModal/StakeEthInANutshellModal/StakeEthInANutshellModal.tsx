import { Icon, IconName, Paragraph, NewModal, Row, Column, useElevation } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { TranslationKey } from '@suite-common/intl-types';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { Elevation, mapElevationToBorder, spacings, spacingsPx } from '@trezor/theme';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { getUnstakingPeriodInDays } from 'src/utils/suite/stake';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';
import styled from 'styled-components';

import { Process } from './Process';
import { StakingInfo } from './StakingInfo';
import { UnstakingInfo } from './UnstakingInfo';

const Processes = styled.div<{ $elevation: Elevation }>`
    margin-top: ${spacingsPx.md};
    padding: ${spacingsPx.md} ${spacingsPx.zero} ${spacingsPx.zero};
    border-top: 1px solid ${mapElevationToBorder};
`;

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
    const { validatorWithdrawTime } = useSelector(state =>
        selectValidatorsQueueData(state, account?.symbol),
    );

    const unstakingPeriod = getUnstakingPeriodInDays(validatorWithdrawTime);

    const dispatch = useDispatch();
    const { elevation } = useElevation();

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
            <Column
                gap={spacings.xl}
                margin={{ top: spacings.sm, bottom: spacings.md }}
                alignItems="flex-start"
            >
                {STAKING_DETAILS.map(({ id, icon, translationId }) => (
                    <Row key={id} gap={spacings.md}>
                        <Icon name={icon} variant="primary" />
                        <Paragraph typographyStyle="hint" variant="tertiary">
                            <Translation
                                id={translationId}
                                values={{
                                    symbol: account?.symbol.toUpperCase(),
                                    count: unstakingPeriod,
                                }}
                            />
                        </Paragraph>
                    </Row>
                ))}
            </Column>
            <Processes $elevation={elevation}>
                <Column alignItems="normal" gap={spacings.md}>
                    {processes.map((process, index) => (
                        <Process
                            key={index}
                            heading={process.heading}
                            badge={process.badge}
                            content={process.content}
                        />
                    ))}
                </Column>
            </Processes>
        </NewModal>
    );
};
