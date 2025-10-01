import { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import styled from 'styled-components';

import { TrezorDevice } from '@suite-common/suite-types';
import { Box, Column, Modal, Row } from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { ConfirmOnDevice } from '@trezor/product-components';
import { zIndices } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import messages from 'src/support/messages';

import {
    CollapsibleOnboardingCard,
    CollapsibleOnboardingCardProps,
} from './CollapsibleOnboardingCard';

export type OnboardingStepBoxProps = CollapsibleOnboardingCardProps & {
    innerActions?: ReactNode;
    outerActions?: ReactNode;
    device?: TrezorDevice;
    disableConfirmWrapper?: boolean;
    nested?: boolean;
    devicePromptTitle?: ReactNode;
    isActionAbortable?: boolean;
};

const StyledCollapsibleOnboardingCard = styled(CollapsibleOnboardingCard)<{
    $isBackDropVisible: boolean;
}>`
    z-index: ${({ $isBackDropVisible }) => ($isBackDropVisible ? zIndices.modal : 0)};
`;

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
            {isBackDropVisible && <Modal.Backdrop zIndex={zIndices.modal} />}
            <Column alignItems="center" gap={20} padding={{ top: image ? 0 : 40 }}>
                <StyledCollapsibleOnboardingCard
                    image={image}
                    heading={heading}
                    description={description}
                    nested={nested}
                    $isBackDropVisible={isBackDropVisible}
                    {...rest}
                >
                    {!disableConfirmWrapper && deviceModelInternal && (
                        <Box
                            position={{
                                type: 'absolute',
                                bottom: `calc(100% + ${image ? 60 : 20}px)`,
                            }}
                        >
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
                        </Box>
                    )}
                    {(children || innerActions) && (
                        <>
                            {children}
                            {innerActions && (
                                <Row justifyContent="center" margin={{ vertical: 32 }}>
                                    {innerActions}
                                </Row>
                            )}
                        </>
                    )}
                </StyledCollapsibleOnboardingCard>
                {outerActions && <Box zIndex={zIndices.onboardingForeground}>{outerActions}</Box>}
            </Column>
        </>
    );
};
