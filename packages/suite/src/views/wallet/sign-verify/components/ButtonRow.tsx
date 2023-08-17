import { Translation } from 'src/components/suite';

import { useLayoutSize } from 'src/hooks/suite';
import { Button, variables } from '@trezor/components';
import { useState } from 'react';
import styled from 'styled-components';

export const Row = styled.div`
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: center;

    & + & {
        padding-top: 12px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }

    @media (min-width: ${variables.SCREEN_SIZE.MD}) and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }

    :last-child {
        flex-direction: row;
        padding-top: 40px;
    }
`;

const StyledButton = styled(Button)`
    width: 170px;

    & + & {
        margin-left: 20px;
    }
`;

interface ButtonRowProps {
    isCompleted: boolean;
    isSubmitting: boolean;
    isSignPage: boolean;
    isTrezorLocked: boolean;
    resetForm: () => void;
    closeScreen: (withCopy?: boolean) => void;
}

export const ButtonRow = ({
    isCompleted,
    isSubmitting,
    isSignPage,
    isTrezorLocked,
    resetForm,
    closeScreen,
}: ButtonRowProps) => {
    const { isMobileLayout } = useLayoutSize();
    const [isCompleteHovered, setIsCompleteHovered] = useState(isMobileLayout);

    return (
        <Row>
            {isCompleted ? (
                <>
                    <StyledButton
                        variant="secondary"
                        icon="REFRESH"
                        iconSize={20}
                        onClick={e => {
                            e.preventDefault();
                            resetForm();
                        }}
                    >
                        <Translation id="TR_CLEAR_ALL" />
                    </StyledButton>

                    {isSignPage ? (
                        <StyledButton
                            variant={isCompleteHovered ? 'primary' : 'secondary'}
                            icon={isCompleteHovered ? undefined : 'CHECK'}
                            iconSize={20}
                            onClick={() => closeScreen(true)}
                            onMouseOver={() => {
                                setIsCompleteHovered(true);
                            }}
                            onMouseLeave={() => setIsCompleteHovered(false)}
                        >
                            {isCompleteHovered ? (
                                <Translation id="TR_COPY_AND_CLOSE" />
                            ) : (
                                <Translation id="TR_SIGNED" />
                            )}
                        </StyledButton>
                    ) : (
                        <StyledButton
                            variant={isCompleteHovered ? 'primary' : 'secondary'}
                            icon={isCompleteHovered ? undefined : 'CHECK'}
                            iconSize={20}
                            onClick={() => closeScreen()}
                            onMouseOver={() => {
                                setIsCompleteHovered(true);
                            }}
                            onMouseLeave={() => setIsCompleteHovered(false)}
                        >
                            {isCompleteHovered ? (
                                <Translation id="TR_CLOSE" />
                            ) : (
                                <Translation id="TR_VERIFIED" />
                            )}
                        </StyledButton>
                    )}
                </>
            ) : (
                <StyledButton
                    type="submit"
                    variant="primary"
                    iconSize={20}
                    isDisabled={isTrezorLocked}
                    isLoading={isSubmitting}
                    data-test="@sign-verify/submit"
                >
                    <Translation id={isSignPage ? 'TR_SIGN' : 'TR_VERIFY'} />
                </StyledButton>
            )}
        </Row>
    );
};
