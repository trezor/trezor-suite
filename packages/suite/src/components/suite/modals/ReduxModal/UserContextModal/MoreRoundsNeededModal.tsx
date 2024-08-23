import styled, { useTheme } from 'styled-components';
import { useDispatch } from 'src/hooks/suite';
import { Button, Icon, variables } from '@trezor/components';
import { onCancel as closeModal } from 'src/actions/suite/modalActions';
import { Modal, Translation } from 'src/components/suite';

const StyledModal = styled(Modal)`
    width: 435px;
`;

const IconWrapper = styled.div`
    width: 84px;
    height: 84px;
    margin: 12px auto 32px;
    border-radius: 50%;
    background: ${({ theme }) => theme.legacy.BG_GREY};
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Text = styled.p`
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Heading = styled.h3`
    font-size: 32px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 32px;
    margin: 10px 0 22px;
`;

export const MoreRoundsNeededModal = () => {
    const theme = useTheme();
    const dispatch = useDispatch();

    const close = () => dispatch(closeModal());

    return (
        <StyledModal
            bottomBarComponents={
                <Button variant="primary" onClick={close} isFullWidth>
                    <Translation id="TR_OK" />
                </Button>
            }
        >
            <IconWrapper>
                <Icon name="confetti" size={32} color={theme.iconSubdued} />
            </IconWrapper>
            <Text>
                <Translation id="TR_COINJOIN_ENDED" />
            </Text>
            <Heading>
                <Translation id="TR_MORE_ROUNDS_NEEDED" />
            </Heading>
            <Text>
                <Translation id="TR_MORE_ROUNDS_NEEDED_DESCRIPTION" />
            </Text>
        </StyledModal>
    );
};
