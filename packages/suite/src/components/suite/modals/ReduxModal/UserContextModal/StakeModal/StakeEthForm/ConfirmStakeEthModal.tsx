import { useState } from 'react';
import styled from 'styled-components';
import { Button, Checkbox, H2, Icon, useTheme, variables } from '@trezor/components';
import { Modal, Translation, TrezorLink } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';

const StyledModal = styled(Modal)`
    width: 500px;
    text-align: left;
`;

const VStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-top: 26px;
`;

const Flex = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Divider = styled.div`
    height: 1px;
    background: ${({ theme }) => theme.STROKE_GREY};
    margin: 20px 0 17px auto;
    max-width: 396px;
    width: 100%;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        max-width: 428px;
    }
`;

const StyledCheckbox = styled(Checkbox)`
    & > div:nth-child(2) {
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
        font-weight: ${variables.FONT_WEIGHT.MEDIUM};
        font-size: ${variables.FONT_SIZE.NORMAL};
    }
`;

const ButtonsWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    width: 100%;
    margin-top: 20px;

    & > button {
        font-size: ${variables.FONT_SIZE.NORMAL};
        padding: 9px 22px;
        flex: 1 0 164px;
    }
`;

interface ConfirmStakeEthModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmStakeEthModal = ({ onConfirm, onCancel }: ConfirmStakeEthModalProps) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const [hasAgreed, setHasAgreed] = useState(false);

    const handleOnCancel = () => {
        onCancel();
        dispatch(openModal({ type: 'stake' }));
    };

    const onClick = () => {
        onConfirm();
    };

    return (
        <StyledModal onCancel={handleOnCancel}>
            <H2>
                <Translation id="TR_STAKE_CONFIRM_ENTRY_PERIOD" />
            </H2>

            <VStack>
                <Flex>
                    <Icon icon="CLOCK" size={24} color={theme.TYPE_DARK_ORANGE} />
                    <Translation id="TR_STAKE_ENTERING_POOL_MAY_TAKE" values={{ days: 35 }} />
                </Flex>
                <Flex>
                    <Icon icon="HAND" size={24} color={theme.TYPE_DARK_ORANGE} />
                    <Translation
                        id="TR_STAKE_ETH_WILL_BE_BLOCKED"
                        values={{
                            a: chunks => (
                                // TODO: Add the right href
                                <TrezorLink target="_blank" variant="underline" href="#">
                                    {chunks}
                                </TrezorLink>
                            ),
                        }}
                    />
                </Flex>
            </VStack>

            <Divider />

            <StyledCheckbox onClick={() => setHasAgreed(!hasAgreed)} isChecked={hasAgreed}>
                <Translation id="TR_STAKE_ACKNOWLEDGE_ENTRY_PERIOD" />
            </StyledCheckbox>

            <ButtonsWrapper>
                <Button variant="tertiary" onClick={handleOnCancel}>
                    <Translation id="TR_CANCEL" />
                </Button>
                <Button isDisabled={!hasAgreed} onClick={onClick}>
                    <Translation id="TR_STAKE_CONFIRM_AND_STAKE" />
                </Button>
            </ButtonsWrapper>
        </StyledModal>
    );
};
