import { ReactNode } from 'react';
import styled from 'styled-components';
import TrezorConnect from '@trezor/connect';
import { ConfirmOnDevice, Backdrop } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useIntl } from 'react-intl';
import messages from 'src/support/messages';
import {
    CollapsibleOnboardingCard,
    CollapsibleOnboardingCardProps,
} from './CollapsibleOnboardingCard';
import { TrezorDevice } from '@suite-common/suite-types';
import { spacingsPx, zIndices } from '@trezor/theme';

const WrapperWrapper = styled.div`
    z-index: ${zIndices.onboardingForeground};
`;

const ConfirmWrapper = styled.div`
    margin-bottom: ${spacingsPx.lg};
    height: 62px;
`;

const InnerActions = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin: ${spacingsPx.xxl} auto;
`;

const OuterActions = styled.div<{ $smallMargin?: boolean }>`
    display: flex;
    margin-top: ${({ $smallMargin }) => ($smallMargin ? '0px' : spacingsPx.lg)};
    width: 100%;
    justify-content: center;
    z-index: ${zIndices.onboardingForeground};
`;

export const StyledBackdrop = styled(Backdrop)<{ $show: boolean }>`
    transition: all 0.3s;
    opacity: ${({ $show }) => ($show ? '1' : '0')};
    pointer-events: ${({ $show }) => ($show ? 'initial' : 'none')};
    z-index: ${zIndices.base};
`;

const StyledCollapsibleCard = styled(CollapsibleOnboardingCard)<{ $isBackDropVisible: boolean }>`
    z-index: ${({ $isBackDropVisible }) => ($isBackDropVisible ? 3 : 0)};
`;

export interface OnboardingStepBoxProps extends CollapsibleOnboardingCardProps {
    innerActions?: ReactNode;
    outerActions?: ReactNode;
    device?: TrezorDevice;
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
    device,
    isActionAbortable,
    disableConfirmWrapper,
    nested,
    devicePromptTitle,
    children,
    ...rest
}: OnboardingStepBoxProps) => {
    const intl = useIntl();

    const deviceModelInternal = device?.features?.internal_model;

    const isBackDropVisible = !!deviceModelInternal && !disableConfirmWrapper;

    return (
        <>
            <StyledBackdrop $show={isBackDropVisible} />
            {!disableConfirmWrapper && (
                <WrapperWrapper data-testid="@onboarding/confirm-on-device">
                    {deviceModelInternal && (
                        <ConfirmWrapper>
                            <ConfirmOnDevice
                                title={
                                    devicePromptTitle || <Translation id="TR_CONFIRM_ON_TREZOR" />
                                }
                                deviceModelInternal={deviceModelInternal}
                                deviceUnitColor={device?.features?.unit_color}
                                onCancel={
                                    isActionAbortable
                                        ? () =>
                                              TrezorConnect.cancel(
                                                  intl.formatMessage(messages.TR_CANCELLED),
                                              )
                                        : undefined
                                }
                            />
                        </ConfirmWrapper>
                    )}
                </WrapperWrapper>
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

            {outerActions && <OuterActions $smallMargin={nested}>{outerActions}</OuterActions>}
        </>
    );
};
