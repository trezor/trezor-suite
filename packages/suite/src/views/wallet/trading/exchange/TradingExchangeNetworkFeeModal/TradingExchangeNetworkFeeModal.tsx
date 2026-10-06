import { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Translation } from '@suite/intl';
import { type TradingComposedTransactionInfo } from '@suite-common/trading';
import { getNetwork, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account, type FeeInfo, type FormState } from '@suite-common/wallet-types';
import { Banner, Column, Modal } from '@trezor/components';
import { WarningCircleIcon } from '@trezor/icons';

import { FeeLevels } from 'src/components/wallet/Fees/CollapsibleFees/FeeLevels/FeeLevels';
import { useFeeLevels } from 'src/components/wallet/Fees/CollapsibleFees/FeeLevels/useFeeLevels';
import { FeesContext } from 'src/components/wallet/Fees/context/FeesContext';
import { useFeesContextValue } from 'src/components/wallet/Fees/context/useFeesContextValue';
import { useCompose } from 'src/hooks/wallet/form/useCompose';
import { useFees } from 'src/hooks/wallet/form/useFees';

import { TradingExchangeNetworkFeeModalTotal } from './TradingExchangeNetworkFeeModalTotal';

export type TradingExchangeNetworkFeeModalProps = {
    account: Account;
    feeInfo: FeeInfo;
    composeFormState: FormState;
    onConfirm: (composedTransactionInfo: TradingComposedTransactionInfo) => void;
    onClose: () => void;
};

export const TradingExchangeNetworkFeeModal = ({
    account,
    feeInfo,
    composeFormState,
    onConfirm,
    onClose,
}: TradingExchangeNetworkFeeModalProps) => {
    const form = useForm<FormState>({ mode: 'onChange', defaultValues: composeFormState });

    const composeContext = useMemo(
        () => ({ account, network: getNetwork(account.symbol), feeInfo }),
        [account, feeInfo],
    );

    const { composedLevels, composeRequest, onFeeLevelChange, isLoading } = useCompose({
        ...form,
        state: composeContext,
        defaultField: 'selectedFee',
    });

    const { changeFeeLevel } = useFees({
        ...form,
        defaultValue: composeFormState.selectedFee ?? 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        composedLevels,
    });

    const fees = useFeesContextValue({
        account,
        control: form.control,
        feeInfo,
        composedLevels,
        changeFeeLevel,
        isComposing: isLoading,
    });
    const { isTrc20Transfer, txMaxFee } = useFeeLevels(fees);

    useEffect(() => {
        composeRequest('selectedFee');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const composedLevel = composedLevels?.[fees.selectedFee];
    const isConfirmDisabled = isLoading || composedLevel?.type !== 'final';

    const onConfirmClick = () => {
        if (composedLevel?.type !== 'final') {
            return;
        }

        onConfirm({
            selectedFee: fees.selectedFee,
            composed: composedLevel,
        });
        onClose();
    };

    return (
        <FormProvider {...form}>
            <Modal
                heading={<Translation id="TR_TRADING_NETWORK_FEE" />}
                description={<Translation id="TR_TRADING_NETWORK_FEE_MODAL_DESC" />}
                onCancel={onClose}
                width={400}
                bottomContent={
                    <>
                        <Modal.Button
                            isDisabled={isConfirmDisabled}
                            onClick={onConfirmClick}
                            data-testid="@trading/network-fee-modal/confirm"
                        >
                            <Translation id="TR_CONFIRM" />
                        </Modal.Button>
                        <Modal.Button
                            intent="neutral"
                            priority="secondary"
                            onClick={onClose}
                            data-testid="@trading/network-fee-modal/cancel"
                        >
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
            >
                <FeesContext.Provider value={fees}>
                    <Column gap={16} overflow="unset">
                        <FeeLevels
                            showCurrentFee
                            feeCardAppearance={{ minWidth: '100%', cardType: 'raised' }}
                        />

                        {!isTrc20Transfer && (
                            <TradingExchangeNetworkFeeModalTotal txMaxFee={txMaxFee} />
                        )}

                        {composedLevel?.type === 'error' && (
                            <Banner
                                icon={WarningCircleIcon}
                                intent="critical"
                                title={
                                    <Translation
                                        id="TR_TRADING_NETWORK_FEE_MODAL_NOT_ENOUGH_FUNDS"
                                        values={{
                                            networkDisplaySymbol: getNetworkDisplaySymbol(
                                                account.symbol,
                                            ),
                                        }}
                                    />
                                }
                                description={
                                    <Translation id="TR_TRADING_NETWORK_FEE_MODAL_NOT_ENOUGH_FUNDS_DESC" />
                                }
                            />
                        )}
                    </Column>
                </FeesContext.Provider>
            </Modal>
        </FormProvider>
    );
};
