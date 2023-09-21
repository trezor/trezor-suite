import styled from 'styled-components';
import { useDispatch } from 'src/hooks/suite';
import { Button, Icon, useTheme, variables } from '@trezor/components';
import { onCancel as closeModal } from 'src/actions/suite/modalActions';
import { Modal, Translation } from 'src/components/suite';

const StyledModal = styled(Modal)`
    width: 435px;
`;

const StyledButton = styled(Button)`
    flex: 1;
`;

const StyledIcon = styled(Icon)`
    width: 84px;
    height: 84px;
    margin: 12px auto 32px;
    border-radius: 50%;
    background: ${({ theme }) => theme.BG_GREY};
`;

const Text = styled.p`
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
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
                <StyledButton variant="secondary" onClick={close}>
                    <Translation id="TR_OK" />
                </StyledButton>
            }
        >
            <StyledIcon icon="CONFETTI_SUCCESS" size={32} color={theme.TYPE_DARK_GREY} />
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
