import { useState } from 'react';
import type { ReactNode } from 'react';
import { useWatch } from 'react-hook-form';

import { Translation, useTranslation } from '@suite/intl';
import { PaymentMethodIcon } from '@suite/trading';
import { useSelector } from '@suite-common/redux-utils';
import {
    TRADING_FORM_PAYMENT_METHOD_SELECT,
    type TradingPaymentMethodListProps,
    type TradingPaymentMethodProps,
    selectTradingPaymentMethodsByType,
    selectTradingSelectedPaymentMethodByType,
} from '@suite-common/trading';
import { GhostContainer, Icon, Row, Skeleton, Text } from '@trezor/components';
import { CaretRightIcon } from '@trezor/icons';

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
        return <Skeleton animate />;
    }

    return (
        <Row gap={16}>
            <Row gap={8} alignItems="center">
                <PaymentMethodIcon paymentMethod={paymentMethod} size={20} />
                <Text typographyStyle={hasPaymentMethods ? 'body-md' : undefined}>
                    {displayLabel}
                </Text>
            </Row>
            {hasPaymentMethods && (
                <Icon as={CaretRightIcon} size={20} intent="neutral" priority="secondary" />
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
        type,
        form: {
            state: { isFormLoading },
        },
    } = useTradingFormContext<TradingTradeBuySellType>();

    const options = useSelector(state => selectTradingPaymentMethodsByType(state, type));

    const paymentMethod = useWatch({ name: TRADING_FORM_PAYMENT_METHOD_SELECT }) as
        TradingPaymentMethodListProps | undefined;
    const hasPaymentMethods = options.length > 0;

    const selectedOption = useSelector(state =>
        selectTradingSelectedPaymentMethodByType(state, type, paymentMethod?.value),
    );

    const displayLabel = hasPaymentMethods
        ? (selectedOption?.label ?? '')
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
                            intent="neutral"
                            priority="secondary"
                        >
                            {label && <Translation id={label} />}
                        </Text>
                        <TradingFormInputPaymentMethodValueContent
                            isFormLoading={isFormLoading}
                            hasPaymentMethods={hasPaymentMethods}
                            displayLabel={displayLabel}
                            paymentMethod={selectedOption?.value ?? ''}
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
