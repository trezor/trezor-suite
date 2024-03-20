import styled, { useTheme } from 'styled-components';
import { Button, Icon, IconType, Paragraph } from '@trezor/components';
import { Modal, Translation } from 'src/components/suite';
import { TranslationKey } from '@suite-common/intl-types';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { spacingsPx } from '@trezor/theme';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const StyledModal = styled(Modal)`
    width: 380px;
`;

const HeadingContent = styled.span`
    color: ${({ theme }) => theme.textPrimaryDefault};
`;

const VStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xl};
    text-align: left;
    margin-bottom: ${spacingsPx.xxl};
`;

const Flex = styled.div`
    display: flex;
    gap: ${spacingsPx.md};
    align-items: center;
`;

const GreyP = styled(Paragraph)`
    color: ${({ theme }) => theme.textSubdued};
`;

interface StakingDetails {
    id: number;
    icon: IconType;
    translationId: TranslationKey;
}

const STAKING_DETAILS: StakingDetails[] = [
    {
        id: 0,
        icon: 'LOCK_SIMPLE',
        translationId: 'TR_STAKE_STAKED_ETH_AMOUNT_LOCKED',
    },
    {
        id: 1,
        icon: 'ARROW_BEND_DOUBLE_UP_LEFT',
        translationId: 'TR_STAKE_UNSTAKING_TAKES',
    },
    {
        id: 2,
        icon: 'HAND_COINS',
        translationId: 'TR_STAKE_ETH_REWARDS_EARN',
    },
];

interface StakeEthInANutshellModalProps {
    onCancel: () => void;
}

export const StakeEthInANutshellModal = ({ onCancel }: StakeEthInANutshellModalProps) => {
    const theme = useTheme();
    const account = useSelector(selectSelectedAccount);

    const dispatch = useDispatch();
    const proceedToEverstakeModal = () => {
        onCancel();
        dispatch(openModal({ type: 'everstake' }));
    };

    return (
        <StyledModal
            isCancelable
            heading={
                <HeadingContent>
                    <Translation id="TR_STAKE_STAKING_IN_A_NUTSHELL" />
                </HeadingContent>
            }
            onCancel={onCancel}
        >
            <VStack>
                {STAKING_DETAILS.map(({ id, icon, translationId }) => (
                    <Flex key={id}>
                        <Icon icon={icon} color={theme.iconPrimaryDefault} />

                        <GreyP>
                            <Translation
                                id={translationId}
                                values={{ symbol: account?.symbol.toUpperCase() }}
                            />
                        </GreyP>
                    </Flex>
                ))}
            </VStack>
            <Button isFullWidth onClick={proceedToEverstakeModal}>
                <Translation id="TR_GOT_IT" />
            </Button>
        </StyledModal>
    );
};
