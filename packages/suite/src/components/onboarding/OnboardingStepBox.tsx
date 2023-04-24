import React from 'react';
import styled from 'styled-components';
import TrezorConnect from '@trezor/connect';
import {
    ConfirmOnDevice,
    Backdrop,
    variables,
    CollapsibleCard,
    CollapsibleCardProps,
} from '@trezor/components';
import { Translation } from '@suite-components';
import { DeviceModel } from '@trezor/device-utils';

const ConfirmWrapper = styled.div`
    margin-bottom: 20px;
    height: 62px;
    z-index: ${variables.Z_INDEX.BASE};
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
    z-index: ${variables.Z_INDEX.BASE};
`;

const StyledBackdrop = styled(Backdrop)<{ show: boolean }>`
    transition: all 0.3s;
    opacity: ${({ show }) => (show ? '1' : '0')};
    pointer-events: ${({ show }) => (show ? 'initial' : 'none')};
    z-index: auto;
`;

export interface OnboardingStepBoxProps extends CollapsibleCardProps {
    innerActions?: React.ReactNode;
    outerActions?: React.ReactNode;
    deviceModel?: DeviceModel;
    disableConfirmWrapper?: boolean;
    nested?: boolean;
    isActionAbortable?: boolean;
}

export const OnboardingStepBox = ({
    heading,
    description,
    image,
    innerActions,
    outerActions,
    deviceModel,
    isActionAbortable,
    disableConfirmWrapper,
    nested,
    children,
    ...rest
}: OnboardingStepBoxProps) => (
    <>
        <StyledBackdrop show={!!deviceModel && !disableConfirmWrapper} />
        {!disableConfirmWrapper && (
            <ConfirmWrapper data-test="@onboarding/confirm-on-device">
                {deviceModel && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        deviceModel={deviceModel}
                        onCancel={isActionAbortable ? () => TrezorConnect.cancel() : undefined}
                    />
                )}
            </ConfirmWrapper>
        )}

        <CollapsibleCard
            image={image}
            heading={heading}
            description={description}
            nested={nested}
            {...rest}
        >
            {(children || innerActions) && (
                <>
                    {children}
                    {innerActions && <InnerActions>{innerActions}</InnerActions>}
                </>
            )}
        </CollapsibleCard>

        {outerActions && <OuterActions smallMargin={nested}>{outerActions}</OuterActions>}
    </>
);
