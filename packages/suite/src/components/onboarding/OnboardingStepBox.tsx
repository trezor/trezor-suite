import { ReactNode } from 'react';
import styled from 'styled-components';
import TrezorConnect, { DeviceModelInternal } from '@trezor/connect';
import { ConfirmOnDevice, Backdrop } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useIntl } from 'react-intl';
import messages from 'src/support/messages';
import {
    CollapsibleOnboardingCard,
    CollapsibleOnboardingCardProps,
} from './CollapsibleOnboardingCard';
import { zIndices } from '@trezor/theme';

const ConfirmWrapper = styled.div`
    margin-bottom: 20px;
    height: 62px;
    z-index: ${zIndices.onboardingForeground};
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
    z-index: ${zIndices.onboardingForeground};
`;

export const StyledBackdrop = styled(Backdrop)<{ show: boolean }>`
    transition: all 0.3s;
    opacity: ${({ show }) => (show ? '1' : '0')};
    pointer-events: ${({ show }) => (show ? 'initial' : 'none')};
    z-index: ${zIndices.base};
`;

const StyledCollapsibleCard = styled(CollapsibleOnboardingCard)<{ $isBackDropVisible: boolean }>`
    z-index: ${({ $isBackDropVisible }) => ($isBackDropVisible ? 3 : 0)};
`;

export interface OnboardingStepBoxProps extends CollapsibleOnboardingCardProps {
    innerActions?: ReactNode;
    outerActions?: ReactNode;
    deviceModelInternal?: DeviceModelInternal;
    disableConfirmWrapper?: boolean;
    nested?: boolean;
    devicePromptTitle?: ReactNode;
    isActionAbortable?: boolean;
}

// Legacy duplicate of CollapsibleBox !! Should not be used elsewhere
export const OnboardingStepBox = ({
    heading,
    description,
    image,
    innerActions,
    outerActions,
    deviceModelInternal,
    isActionAbortable,
    disableConfirmWrapper,
    nested,
    devicePromptTitle,
    children,
    ...rest
}: OnboardingStepBoxProps) => {
    const intl = useIntl();

    const isBackDropVisible = !!deviceModelInternal && !disableConfirmWrapper;

    return (
        <>
            <StyledBackdrop show={isBackDropVisible} />
            {!disableConfirmWrapper && (
                <ConfirmWrapper data-test="@onboarding/confirm-on-device">
                    {deviceModelInternal && (
                        <ConfirmOnDevice
                            title={devicePromptTitle || <Translation id="TR_CONFIRM_ON_TREZOR" />}
                            deviceModelInternal={deviceModelInternal}
                            onCancel={
                                isActionAbortable
                                    ? () =>
                                          TrezorConnect.cancel(
                                              intl.formatMessage(messages.TR_CANCELLED),
                                          )
                                    : undefined
                            }
                        />
                    )}
                </ConfirmWrapper>
            )}

            <StyledCollapsibleCard
                image={image}
                heading={heading}
                description={description}
                nested={nested}
                $isBackDropVisible={isBackDropVisible}
                {...rest}
            >
                {(children || innerActions) && (
                    <>
                        {children}
                        {innerActions && <InnerActions>{innerActions}</InnerActions>}
                    </>
                )}
            </StyledCollapsibleCard>

            {outerActions && <OuterActions smallMargin={nested}>{outerActions}</OuterActions>}
        </>
    );
};
