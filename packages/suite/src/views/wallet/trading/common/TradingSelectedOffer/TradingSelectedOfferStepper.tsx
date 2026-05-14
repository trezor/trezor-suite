import { Fragment, type JSX } from 'react';

import { type ExtendedMessageDescriptor, Translation } from '@suite/intl';
import { Icon, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

export interface TradingSelectedOfferStepperItemProps {
    step: string;
    translationId: ExtendedMessageDescriptor['id'];
    isActive: boolean;
    component: JSX.Element | null;
}

interface TradingSelectedOfferStepperProps {
    steps: TradingSelectedOfferStepperItemProps[];
}

export const TradingSelectedOfferStepper = ({ steps }: TradingSelectedOfferStepperProps) => (
    <Row justifyContent="center" gap={spacings.xl}>
        {steps.map((step, index) => (
            <Fragment key={index}>
                <Row flex="1" justifyContent="center">
                    <Text
                        intent={step.isActive ? 'brand' : 'neutral'}
                        priority={step.isActive ? 'primary' : 'secondary'}
                    >
                        <Translation id={step.translationId} />
                    </Text>
                </Row>
                {index < steps.length - 1 && (
                    <Icon name="caretRight" intent="neutral" priority="secondary" size={20} />
                )}
            </Fragment>
        ))}
    </Row>
);
