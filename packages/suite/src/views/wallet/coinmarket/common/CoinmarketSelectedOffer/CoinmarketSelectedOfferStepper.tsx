import { Fragment } from 'react';

import { Icon, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { ExtendedMessageDescriptor } from 'src/types/suite';

export interface CoinmarketSelectedOfferStepperItemProps {
    step: string;
    translationId: ExtendedMessageDescriptor['id'];
    isActive: boolean;
    component: JSX.Element | null;
}

interface CoinmarketSelectedOfferStepperProps {
    steps: CoinmarketSelectedOfferStepperItemProps[];
}

export const CoinmarketSelectedOfferStepper = ({ steps }: CoinmarketSelectedOfferStepperProps) => {
    return (
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
};
