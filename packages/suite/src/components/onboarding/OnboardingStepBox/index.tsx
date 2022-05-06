import React from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice, Backdrop, variables } from '@trezor/components';
import { Box, BoxProps } from '@onboarding-components';
import { Translation } from '@suite-components';

const ConfirmWrapper = styled.div`
    margin-bottom: 20px;
    height: 62px;
    z-index: 1;
`;

const InnerActions = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 32px;
`;

const OuterActions = styled.div<{ smallMargin?: boolean }>`
    display: flex;
    margin-top: ${({ smallMargin }) => (smallMargin ? '0px' : '20px')};
    width: 100%;
    justify-content: center;
    z-index: 1;
    height: 62px;
`;

const StyledBackdrop = styled(Backdrop)<{ show: boolean }>`
    transition: all 0.3s;
    opacity: ${({ show }) => (show ? '1' : '0')};
    pointer-events: ${({ show }) => (show ? 'initial' : 'none')};
    z-index: ${variables.Z_INDEX.BASE};
`;

export interface OnboardingStepBoxProps extends BoxProps {
    innerActions?: React.ReactNode;
    outerActions?: React.ReactNode;
    confirmOnDevice?: number;
    disableConfirmWrapper?: boolean;
    nested?: boolean;
}

export const OnboardingStepBox = ({
    heading,
    description,
    image,
    innerActions,
    outerActions,
    confirmOnDevice,
    disableConfirmWrapper,
    nested,
    className,
    children,
    ...rest
}: OnboardingStepBoxProps) => (
    <>
        <StyledBackdrop show={!!confirmOnDevice && !disableConfirmWrapper} />
        {!disableConfirmWrapper && (
            <ConfirmWrapper data-test="@onboarding/confirm-on-device">
                {confirmOnDevice && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        trezorModel={confirmOnDevice === 1 ? 1 : 2}
                        animated
                    />
                )}
            </ConfirmWrapper>
        )}

        <Box image={image} heading={heading} description={description} nested={nested} {...rest}>
            {(children || innerActions) && (
                <>
                    {children}
                    {innerActions && <InnerActions>{innerActions}</InnerActions>}
                </>
            )}
        </Box>

        {outerActions && <OuterActions smallMargin={nested}>{outerActions}</OuterActions>}
    </>
);
