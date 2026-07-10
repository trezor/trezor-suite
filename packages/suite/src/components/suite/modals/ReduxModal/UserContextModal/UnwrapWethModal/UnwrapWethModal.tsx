import { FormProvider, useForm } from 'react-hook-form';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import {
    WRAPPED_NATIVE_TOKEN_DECIMALS,
    getNetworkDisplaySymbol,
    isWrappedNativeToken,
} from '@suite-common/wallet-config';
import { WETH_WRAP_GAS_RESERVE } from '@suite-common/wallet-constants';
import { type YieldFlowFormValues } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Button, Column, Modal } from '@trezor/components';
import { InfoIcon } from '@trezor/icons';
import { BigNumber } from '@trezor/utils';

import { setConnectionModal, setConnectionMode } from 'src/actions/device/deviceSlice';
import { submitWethUnwrapThunk } from 'src/actions/wallet/weth';
import { YieldAmountCard } from 'src/components/earn/yield/common/YieldAmountCard';
import { isAmountGreaterThan } from 'src/components/earn/yield/yieldFlowUtils';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { useDispatch, useSelector } from 'src/hooks/suite';

type UnwrapWethModalProps = {
    account: Account;
    prefillAmount?: string;
    onCancel: () => void;
};

export const UnwrapWethModal = ({ account, prefillAmount, onCancel }: UnwrapWethModalProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { device } = useDevice();
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);

    const wethToken = account.tokens?.find(token =>
        isWrappedNativeToken(account.symbol, token.contract),
    );
    const wethBalance = wethToken?.balance ?? '0';
    const wethSymbol = wethToken?.symbol ?? 'WETH';
    const nativeSymbol = getNetworkDisplaySymbol(account.symbol);
    const nativeBalance = account.formattedBalance;

    const methods = useForm<YieldFlowFormValues>({
        mode: 'onChange',
        defaultValues: {
            amountInput: prefillAmount ? BigNumber.min(prefillAmount, wethBalance).toString() : '',
        },
    });

    const liveAmount = methods.watch('amountInput');
    const isAmountEmpty =
        !liveAmount || !isAmountGreaterThan({ amount: liveAmount, threshold: '0' });
    const isAmountTooHigh = isAmountGreaterThan({ amount: liveAmount, threshold: wethBalance });
    const isAmountInvalidDecimals = !!methods.formState.errors.amountInput;
    const isLowOnNativeForFee = new BigNumber(nativeBalance || '0').lt(WETH_WRAP_GAS_RESERVE);
    const hasNoNativeForFee = new BigNumber(nativeBalance || '0').lte(0);

    const isDeviceConnected = !!device?.connected && !!device?.available;

    const handleCancel = () => {
        analytics.report({
            type: events.wethUnwrapEvent.name,
            payload: {
                type: 'unwrap-form-modal',
                action: 'cancel',
                networkSymbol: account.symbol,
            },
        });

        onCancel();
    };

    const handleMaxClick = () => {
        methods.setValue('amountInput', wethBalance, { shouldValidate: true });
    };

    const handleSubmit = () => {
        if (!isDeviceConnected) {
            if (device?.descriptor?.apiType === 'bluetooth') {
                dispatch(setConnectionMode('bluetooth'));
            }
            dispatch(setConnectionModal(true));

            return;
        }

        const amount = methods.getValues('amountInput');

        // The deferred simulation/review modals replace this one, so close it
        // right away and let the thunk drive the rest of the flow.
        onCancel();

        void dispatch(submitWethUnwrapThunk({ account, amount }));
    };

    return (
        <Modal
            width={480}
            heading={<Translation id="TR_UNWRAP_WETH_HEADING" values={{ symbol: wethSymbol }} />}
            description={
                <Translation
                    id="TR_UNWRAP_WETH_DESCRIPTION"
                    values={{ symbol: wethSymbol, nativeSymbol }}
                />
            }
            onCancel={handleCancel}
            bottomContent={
                <Button
                    size="large"
                    width="100%"
                    onClick={handleSubmit}
                    isDisabled={
                        isAmountEmpty ||
                        isAmountTooHigh ||
                        isAmountInvalidDecimals ||
                        hasNoNativeForFee ||
                        isDeviceCompromised
                    }
                >
                    <Translation id="TR_UNWRAP_TO_NATIVE" values={{ symbol: nativeSymbol }} />
                </Button>
            }
        >
            <FormProvider {...methods}>
                <Column gap={16}>
                    <YieldAmountCard
                        tokenSymbol={wethSymbol}
                        decimals={WRAPPED_NATIVE_TOKEN_DECIMALS}
                        summary={{
                            labelTranslationId: 'TR_BALANCE',
                            value: (
                                <FormattedCryptoAmount value={wethBalance} symbol={wethSymbol} />
                            ),
                            onMaxClick: handleMaxClick,
                        }}
                        heading={{
                            amountLabelTranslationId: 'TR_UNWRAP_AMOUNT',
                        }}
                        warning={
                            !isAmountInvalidDecimals && isAmountTooHigh ? (
                                <Banner
                                    intent="warning"
                                    description={<Translation id="AMOUNT_IS_NOT_ENOUGH" />}
                                />
                            ) : undefined
                        }
                    />

                    {isLowOnNativeForFee && (
                        <Banner
                            icon={InfoIcon}
                            intent="warning"
                            description={
                                <Translation
                                    id="TR_UNWRAP_LOW_ETH_FOR_FEE"
                                    values={{ symbol: nativeSymbol }}
                                />
                            }
                        />
                    )}
                </Column>
            </FormProvider>
        </Modal>
    );
};
