import { Fragment, JSX } from 'react';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { Icon, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

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
                    <Text variant={step.isActive ? 'primary' : 'tertiary'}>
                        <Translation id={step.translationId} />
                    </Text>
                </Row>
                {index < steps.length - 1 && (
                    <Icon name="caretRight" variant="tertiary" size={20} />
                )}
            </Fragment>
        ))}
    </Row>
);
