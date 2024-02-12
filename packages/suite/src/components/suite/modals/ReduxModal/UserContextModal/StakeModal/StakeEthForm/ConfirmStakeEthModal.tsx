import { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { Button, Checkbox, H2, Icon, Divider } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
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
    gap: ${spacingsPx.lg};
    margin-top: ${spacingsPx.xl};
`;

const Flex = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.md};
`;

const DividerWrapper = styled.div`
    & > div {
        background: ${({ theme }) => theme.borderOnElevation1};
        margin: ${spacingsPx.lg} 0 ${spacingsPx.md} auto;
        max-width: 428px;
        width: 100%;
    }
`;

const StyledCheckbox = styled(Checkbox)`
    & > div:nth-child(3) {
        color: ${({ theme }) => theme.textSubdued};
        margin-left: ${spacingsPx.xs};
    }
`;

const ButtonsWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${spacingsPx.xxs};
    width: 100%;
    margin-top: ${spacingsPx.lg};

    & > button {
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
                    <Icon icon="CLOCK" size={24} color={theme.iconAlertYellow} />
                    <Translation id="TR_STAKE_ENTERING_POOL_MAY_TAKE" values={{ days: 35 }} />
                </Flex>
                <Flex>
                    <Icon icon="HAND" size={24} color={theme.iconAlertYellow} />
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

            <DividerWrapper>
                <Divider />
            </DividerWrapper>

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
