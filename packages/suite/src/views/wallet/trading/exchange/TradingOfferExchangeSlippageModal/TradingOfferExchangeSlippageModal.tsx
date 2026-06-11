import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';
import { type ExchangeTrade } from 'invity-api';

import { Translation, useTranslation } from '@suite/intl';
import {
    type SlippageFormValues,
    TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
    type TradingExchangeType,
    getSlippageFormValidationSchema,
} from '@suite-common/trading';
import { yup } from '@suite-common/validators';
import { Banner, Column, Modal } from '@trezor/components';

import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';

import { TradingOfferExchangeSlippageInput } from './TradingOfferExchangeSlippageInput';
import { TradingOfferExchangeSlippageSummary } from './TradingOfferExchangeSlippageSummary';

interface TradingOfferExchangeSlippageModalProps {
    onClose: () => void;
    selectedQuote: ExchangeTrade;
}

export const TradingOfferExchangeSlippageModal = ({
    onClose,
    selectedQuote,
}: TradingOfferExchangeSlippageModalProps) => {
    const { translationString } = useTranslation();
    const { confirmTrade } = useTradingFormContext<TradingExchangeType>();
    const [hasSubmitError, setHasSubmitError] = useState(false);

    const form = useForm<SlippageFormValues>({
        mode: 'onChange',
        defaultValues: {
            slippage:
                selectedQuote.swapSlippage ?? TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
        },
        resolver: yupResolver(
            yup.object({
                slippage: getSlippageFormValidationSchema({
                    required: translationString('TR_EXCHANGE_SWAP_SLIPPAGE_NOT_SET'),
                    notNumber: translationString('TR_EXCHANGE_SWAP_SLIPPAGE_NOT_NUMBER'),
                    outOfRange: translationString('TR_EXCHANGE_SWAP_SLIPPAGE_NOT_IN_RANGE'),
                }),
            }),
        ),
    });

    const {
        handleSubmit,
        formState: { errors, isSubmitting },
    } = form;

    const onSubmit = async ({ slippage }: SlippageFormValues) => {
        if (!selectedQuote.receiveAddress) {
            setHasSubmitError(true);

            return;
        }
        setHasSubmitError(false);

        try {
            const result = await confirmTrade({
                receiveAddress: selectedQuote.receiveAddress,
                trade: {
                    ...selectedQuote,
                    swapSlippage: slippage,
                    approvalType: undefined,
                },
            });

            if (result) {
                onClose();
            }
        } catch {
            setHasSubmitError(true);
        }
    };

    const onCloseModal = () => {
        if (isSubmitting) {
            return;
        }
        onClose();
    };

    return (
        <FormProvider {...form}>
            <Modal
                heading={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_AMOUNT" />}
                description={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_INFO" />}
                onCancel={onCloseModal}
                width={400}
                bottomContent={
                    <>
                        <Modal.Button
                            isLoading={isSubmitting}
                            isDisabled={!!errors.slippage || isSubmitting}
                            onClick={handleSubmit(onSubmit)}
                        >
                            <Translation id="TR_CONFIRM" />
                        </Modal.Button>
                        <Modal.Button
                            intent="neutral"
                            priority="secondary"
                            isDisabled={isSubmitting}
                            onClick={onCloseModal}
                        >
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
            >
                <Column gap={16}>
                    <TradingOfferExchangeSlippageInput />
                    <TradingOfferExchangeSlippageSummary selectedQuote={selectedQuote} />

                    {hasSubmitError && (
                        <Banner
                            intent="critical"
                            icon
                            data-testid="@trading/slippage-modal/error"
                            description={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_ERROR" />}
                        />
                    )}
                </Column>
            </Modal>
        </FormProvider>
    );
};
