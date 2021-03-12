import React from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice } from '@trezor/components';
import { Box, BoxProps } from '@onboarding-components';
import { Backdrop, Translation } from '@suite-components';

const OuterActions = styled.div<{ smallMargin?: boolean }>`
    display: flex;
    margin-top: ${props => (props.smallMargin ? '0px' : '40px')};
    width: 100%;
    justify-content: center;
`;

const InnerActions = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 32px;
`;

const ConfirmWrapper = styled.div`
    margin-bottom: 20px;
    z-index: 1;
    height: 62px;
`;

interface Props extends BoxProps {
    innerActions?: React.ReactNode;
    outerActions?: React.ReactNode;
    confirmOnDevice?: number;
    disableConfirmWrapper?: boolean;
    nested?: boolean;
}

const OnboardingStepBox = ({
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
}: Props) => (
    <>
        <Backdrop show={!!confirmOnDevice && !disableConfirmWrapper} animated zIndex={0} />
        {!disableConfirmWrapper && (
            <ConfirmWrapper data-test="@onboarding/confirm-on-device">
                {typeof confirmOnDevice === 'number' && (
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

export default OnboardingStepBox;
export type { Props as OnboardingStepBoxProps };
