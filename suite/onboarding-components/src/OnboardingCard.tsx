import { type ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { Translation, messages } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import {
    Box,
    Card,
    Column,
    H2,
    IconCircle,
    type IconCircleIntent,
    type IconComponent,
    Modal,
    Paragraph,
    Row,
} from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { getDeviceColorVariant } from '@trezor/device-utils';
import { ConfirmOnDevicePill } from '@trezor/product-components';
import { zIndices } from '@trezor/theme';

import { OnboardingCardButton } from './OnboardingCardButton';
import { OnboardingCardSecondaryButton } from './OnboardingCardSecondaryButton';

export type OnboardingCardProps = {
    heading?: ReactNode;
    description?: ReactNode;
    innerActions?: ReactNode;
    outerActions?: ReactNode;
    icon?: IconComponent;
    device?: TrezorDevice;
    isConfirmedOnDevice?: boolean;
    devicePrompt?: ReactNode;
    isActionAbortable?: boolean;
    children?: ReactNode;
    intent?: IconCircleIntent;
    'data-testid'?: string;
};

export const OnboardingCard = ({
    heading,
    description,
    icon,
    innerActions,
    outerActions,
    device,
    isActionAbortable,
    isConfirmedOnDevice = false,
    devicePrompt,
    children,
    intent = 'brand',
    'data-testid': dataTestId,
}: OnboardingCardProps) => {
    const intl = useIntl();
    const deviceModelInternal = device?.features?.internal_model;
    const isBackDropVisible = !!deviceModelInternal && isConfirmedOnDevice;

    const content = (
        <Column alignItems="center" gap={32} width="100%">
            {isBackDropVisible && (
                <ConfirmOnDevicePill
                    title={devicePrompt || <Translation id="TR_CONFIRM_ON_TREZOR" />}
                    deviceModelInternal={deviceModelInternal}
                    deviceUnitColor={getDeviceColorVariant(device)}
                    onCancel={
                        isActionAbortable
                            ? () =>
                                  TrezorConnect.cancel({
                                      reason: intl.formatMessage(messages.TR_CANCELLED),
                                  })
                            : undefined
                    }
                />
            )}
            <Column
                alignItems="center"
                gap={20}
                position={{ type: 'relative' }}
                padding={{ top: icon ? 48 : 0 }}
                margin={{ top: icon && !isBackDropVisible ? -64 : 0 }}
                width="100%"
            >
                <Card paddingType="none" data-testid={dataTestId} maxWidth={1020}>
                    <Column gap={48} padding={64} margin={icon ? { top: 40 } : undefined}>
                        {(heading || description) && (
                            <Column gap={16} alignItems="center" width="100%">
                                {heading && <H2 align="center">{heading}</H2>}
                                {description && (
                                    <Paragraph
                                        typographyStyle="body-md"
                                        intent="neutral"
                                        priority="secondary"
                                        align="center"
                                        width="80%"
                                    >
                                        {description}
                                    </Paragraph>
                                )}
                            </Column>
                        )}
                        {children && <Box>{children}</Box>}
                        {innerActions && <Row justifyContent="center">{innerActions}</Row>}
                    </Column>
                </Card>
                {icon && (
                    <Box
                        position={{ type: 'absolute', top: 0 }}
                        zIndex={isBackDropVisible ? zIndices.modal : undefined}
                        backgroundColor="surfaceFillPage"
                        borderRadius="full"
                    >
                        <IconCircle icon={icon} size={96} intent={intent} />
                    </Box>
                )}
                {outerActions && <Box zIndex={zIndices.onboardingForeground}>{outerActions}</Box>}
            </Column>
        </Column>
    );

    return isBackDropVisible ? <Modal.Backdrop>{content}</Modal.Backdrop> : content;
};

OnboardingCard.Button = OnboardingCardButton;
OnboardingCard.SecondaryButton = OnboardingCardSecondaryButton;
