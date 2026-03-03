import { ReactNode } from 'react';
import { useIntl } from 'react-intl';

import { Translation, messages } from '@suite/intl';
import { TrezorDevice } from '@suite-common/suite-types';
import {
    Box,
    Card,
    Column,
    H2,
    IconCircle,
    IconName,
    Modal,
    Padding,
    Paragraph,
    Row,
} from '@trezor/components';
import { UIVariant } from '@trezor/components/src/config/types';
import TrezorConnect from '@trezor/connect';
import { getDeviceColorVariant } from '@trezor/device-utils';
import { ConfirmOnDevicePill } from '@trezor/product-components';
import { zIndices } from '@trezor/theme';

import { useLayoutSize } from 'src/hooks/suite';

import { OnboardingCardButton } from './OnboardingCardButton';
import { OnboardingCardSecondaryButton } from './OnboardingCardSecondaryButton';

export const onboardingCardVariants = ['primary', 'warning', 'destructive', 'info'] as const;
export type OnboardingCardVariant = Extract<UIVariant, (typeof onboardingCardVariants)[number]>;

const mapVariantToIconCircleIntent = (variant: OnboardingCardVariant) => {
    if (variant === 'destructive') {
        return 'critical' as const;
    }

    if (variant === 'warning') {
        return 'warning' as const;
    }

    if (variant === 'info') {
        return 'info' as const;
    }

    return 'brand' as const;
};

export type OnboardingCardProps = {
    heading?: ReactNode;
    description?: ReactNode;
    innerActions?: ReactNode;
    outerActions?: ReactNode;
    iconName?: IconName;
    device?: TrezorDevice;
    isConfirmedOnDevice?: boolean;
    devicePrompt?: ReactNode;
    isActionAbortable?: boolean;
    children?: ReactNode;
    padding?: Padding;
    variant?: OnboardingCardVariant;
    'data-testid'?: string;
};

export const OnboardingCard = ({
    heading,
    description,
    iconName,
    innerActions,
    outerActions,
    device,
    isActionAbortable,
    isConfirmedOnDevice = false,
    devicePrompt,
    children,
    padding,
    variant = 'primary',
    'data-testid': dataTestId,
}: OnboardingCardProps) => {
    const intl = useIntl();
    const deviceModelInternal = device?.features?.internal_model;
    const isBackDropVisible = !!deviceModelInternal && isConfirmedOnDevice;
    const { isBelowTablet } = useLayoutSize();

    const defaultPadding = isBelowTablet ? 40 : 80;

    return (
        <>
            {isBackDropVisible && <Modal.Backdrop zIndex={zIndices.modal} />}
            <Column
                alignItems="center"
                gap={20}
                position={{ type: 'relative' }}
                padding={{ top: iconName ? 48 : 0 }}
                width="100%"
            >
                {isBackDropVisible && (
                    <Box
                        zIndex={zIndices.modal}
                        position={{ type: 'absolute', bottom: 'calc(100% + 32px)' }}
                    >
                        <ConfirmOnDevicePill
                            title={devicePrompt || <Translation id="TR_CONFIRM_ON_TREZOR" />}
                            deviceModelInternal={deviceModelInternal}
                            deviceUnitColor={getDeviceColorVariant(device)}
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
                <Card
                    zIndex={isBackDropVisible ? zIndices.modal : undefined}
                    paddingType="none"
                    data-testid={dataTestId}
                >
                    <Column
                        gap={48}
                        padding={padding ?? defaultPadding}
                        margin={iconName ? { top: 40 } : undefined}
                    >
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
                {iconName && (
                    <Box
                        position={{ type: 'absolute', top: 0 }}
                        zIndex={isBackDropVisible ? zIndices.modal : undefined}
                    >
                        <IconCircle
                            name={iconName}
                            size={96}
                            intent={mapVariantToIconCircleIntent(variant)}
                        />
                    </Box>
                )}
                {outerActions && <Box zIndex={zIndices.onboardingForeground}>{outerActions}</Box>}
            </Column>
        </>
    );
};

OnboardingCard.Button = OnboardingCardButton;
OnboardingCard.SecondaryButton = OnboardingCardSecondaryButton;
