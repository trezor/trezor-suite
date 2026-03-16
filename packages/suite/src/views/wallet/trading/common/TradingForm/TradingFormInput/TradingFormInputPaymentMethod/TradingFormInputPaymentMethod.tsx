import { useState } from 'react';
import type { ReactNode } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { PaymentMethodIcon } from '@suite/trading';
import {
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    type TradingPaymentMethodProps,
} from '@suite-common/trading';
import { GhostContainer, Icon, Row, SkeletonRectangle, Text } from '@trezor/components';

import { FakeSelect } from 'src/components/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { type TradingTradeBuySellType } from 'src/types/trading/trading';
import { type TradingFormInputDefaultProps } from 'src/types/trading/tradingForm';

import { PaymentMethodModal } from './PaymentMethodModal';

const TradingFormInputPaymentMethodValueContent = ({
    isFormLoading,
    hasPaymentMethods,
    displayLabel,
    paymentMethod,
}: {
    isFormLoading: boolean;
    hasPaymentMethods: boolean;
    displayLabel: ReactNode;
    paymentMethod: TradingPaymentMethodProps;
}) => {
    if (isFormLoading) {
        return <SkeletonRectangle animate />;
    }

    return (
        <Row gap={16}>
            <Row gap={4} alignItems="center">
                <PaymentMethodIcon paymentMethod={paymentMethod} size={16} />
                <Text typographyStyle={hasPaymentMethods ? 'body-md' : undefined}>
                    {displayLabel}
                </Text>
            </Row>
            {hasPaymentMethods && (
                <Icon name="caretRight" size={20} intent="neutral" priority="secondary" />
            )}
        </Row>
    );
};

interface TradingFormInputPaymentMethodProps extends TradingFormInputDefaultProps {
    renderInput?: boolean;
}

export const TradingFormInputPaymentMethod = ({
    label,
    renderInput = false,
}: TradingFormInputPaymentMethodProps) => {
    const { translationString } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const {
        paymentMethods,
        defaultPaymentMethod,
        form: {
            state: { isFormLoading },
        },
        watch,
    } = useTradingFormContext<TradingTradeBuySellType>();

    const paymentMethod = watch()[TRADING_FORM_PAYMENT_METHOD_SELECT];
    const hasPaymentMethods = paymentMethods.length > 0;

    const selectedOption = hasPaymentMethods
        ? paymentMethods.find(item => item.value === (paymentMethod?.value ?? defaultPaymentMethod))
        : undefined;

    const paymentMethodValue =
        selectedOption?.value ?? paymentMethod?.value ?? paymentMethods[0]?.value;

    const displayLabel = hasPaymentMethods
        ? (selectedOption?.label ?? paymentMethod?.label ?? paymentMethods[0]?.label ?? '')
        : translationString('TR_TRADING_NO_METHODS_AVAILABLE');

    return (
        <>
            {renderInput && (
                <FakeSelect
                    value={displayLabel}
                    placeholder={label ? translationString(label) : undefined}
                    onClick={() => setIsModalOpen(true)}
                    isLoading={isFormLoading}
                    isDisabled={isFormLoading || !hasPaymentMethods}
                    data-testid="@trading/form/payment-method-select"
                />
            )}
            {!renderInput && (
                <GhostContainer
                    onClick={() => setIsModalOpen(true)}
                    isDisabled={!hasPaymentMethods || isFormLoading}
                    borderRadius={0}
                    data-testid="@trading/form/payment-method-select"
                >
                    <Row justifyContent="space-between" padding={20}>
                        <Text
                            typographyStyle="body-md"
                            align="start"
                            data-testid="@trading/form/payment-method-select/value"
                        >
                            {label && <Translation id={label} />}
                        </Text>
                        <TradingFormInputPaymentMethodValueContent
                            isFormLoading={isFormLoading}
                            hasPaymentMethods={hasPaymentMethods}
                            displayLabel={displayLabel}
                            paymentMethod={paymentMethodValue}
                        />
                    </Row>
                </GhostContainer>
            )}
            {isModalOpen && hasPaymentMethods && (
                <PaymentMethodModal onClose={() => setIsModalOpen(false)} heading={label} />
            )}
        </>
    );
};
