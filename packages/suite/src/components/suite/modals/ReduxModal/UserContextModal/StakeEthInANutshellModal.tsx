import { Icon, IconName, Paragraph, NewModal, Row, Column } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { TranslationKey } from '@suite-common/intl-types';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { spacings } from '@trezor/theme';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { getUnstakingPeriodInDays } from 'src/utils/suite/stake';
import { selectValidatorsQueueData } from '@suite-common/wallet-core';

interface StakingDetails {
    id: number;
    icon: IconName;
    translationId: TranslationKey;
}

const STAKING_DETAILS: StakingDetails[] = [
    {
        id: 0,
        icon: 'lock',
        translationId: 'TR_STAKE_STAKED_ETH_AMOUNT_LOCKED',
    },
    {
        id: 1,
        icon: 'arrowBendDoubleUpLeft',
        translationId: 'TR_STAKE_UNSTAKING_TAKES',
    },
    {
        id: 2,
        icon: 'handCoins',
        translationId: 'TR_STAKE_ETH_REWARDS_EARN',
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
    const proceedToEverstakeModal = () => {
        onCancel();
        dispatch(openModal({ type: 'everstake' }));
    };

    return (
        <NewModal
            size="tiny"
            heading={<Translation id="TR_STAKE_STAKING_IN_A_NUTSHELL" />}
            onCancel={onCancel}
            bottomContent={
                <NewModal.Button isFullWidth onClick={proceedToEverstakeModal}>
                    <Translation id="TR_GOT_IT" />
                </NewModal.Button>
            }
        >
            <Column gap={spacings.xl} margin={{ top: spacings.sm, bottom: spacings.md }}>
                {STAKING_DETAILS.map(({ id, icon, translationId }) => (
                    <Row key={id} gap={spacings.md}>
                        <Icon name={icon} variant="primary" />
                        <Paragraph>
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
        </NewModal>
    );
};
