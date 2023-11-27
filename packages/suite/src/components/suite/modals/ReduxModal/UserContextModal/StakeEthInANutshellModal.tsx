import styled from 'styled-components';
import { Button, Icon, IconType, P, useTheme } from '@trezor/components';
import { Modal, Translation } from 'src/components/suite';
import { TranslationKey } from '@suite-common/intl-types';
import { useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';

const StyledModal = styled(Modal)`
    width: 380px;
`;

const HeadingContent = styled.span`
    color: ${({ theme }) => theme.TYPE_GREEN};
`;

const VStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: 22px;
    text-align: left;
`;

const Flex = styled.div`
    display: flex;
    gap: 16px;
    align-items: center;
`;

const GreyP = styled(P)`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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
        translationId: 'TR_STAKED_ETH_AMOUNT_LOCKED',
    },
    {
        id: 1,
        icon: 'ARROW_BEND_DOUBLE_UP_LEFT',
        translationId: 'TR_UNSTAKING_TAKES',
    },
    {
        id: 2,
        icon: 'HAND_COINS',
        translationId: 'TR_ETH_REWARDS_EARN',
    },
];

interface StakeEthInANutshellModalProps {
    onCancel: () => void;
}

export const StakeEthInANutshellModal = ({ onCancel }: StakeEthInANutshellModalProps) => {
    const theme = useTheme();

    const dispatch = useDispatch();
    const proceedToStaking = () => {
        onCancel();
        dispatch(openModal({ type: 'stake' }));
    };

    return (
        <StyledModal
            isCancelable
            heading={
                <HeadingContent>
                    <Translation id="TR_STAKING_IN_A_NUTSHELL" />
                </HeadingContent>
            }
            bottomBar={
                <Button fullWidth onClick={proceedToStaking}>
                    <Translation id="TR_GOT_IT" />
                </Button>
            }
            onCancel={onCancel}
        >
            <VStack>
                {STAKING_DETAILS.map(({ id, icon, translationId }) => (
                    <Flex key={id}>
                        <Icon icon={icon} color={theme.TYPE_GREEN} />

                        <GreyP size="small" weight="medium">
                            <Translation id={translationId} />
                        </GreyP>
                    </Flex>
                ))}
            </VStack>
        </StyledModal>
    );
};
