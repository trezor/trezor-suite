import React from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice } from '@trezor/components';
import { Box, BoxProps } from '@onboarding-components';
import { Backdrop, Translation } from '@suite-components';

const OuterActions = styled.div`
    display: flex;
    margin-top: 40px;
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
}

const OnboardingStepBox = ({
    heading,
    description,
    image,
    innerActions,
    outerActions,
    confirmOnDevice,
    disableConfirmWrapper,
    className,
    children,
    ...rest
}: Props) => (
    <>
        <Backdrop show={!!confirmOnDevice} animated zIndex={0} />
        {!disableConfirmWrapper ? (
            // todo: hey why is this file under /firmware path? :D
            <ConfirmWrapper data-test="@onboarding/confirm-on-device">
                {typeof confirmOnDevice === 'number' ? (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        trezorModel={confirmOnDevice === 1 ? 1 : 2}
                    />
                ) : undefined}
            </ConfirmWrapper>
        ) : undefined}
        <Box image={image} heading={heading} description={description} {...rest}>
            {(children || innerActions) && (
                <>
                    {children}
                    {innerActions && <InnerActions>{innerActions}</InnerActions>}
                </>
            )}
        </Box>
        {outerActions && <OuterActions>{outerActions}</OuterActions>}
    </>
);

export default OnboardingStepBox;
export { OnboardingStepBox };
export type { Props as OnboardingStepBoxProps };
