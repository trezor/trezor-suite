import { useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';

import { Translation, messages } from '@suite/intl';
import { onReceiveFee } from '@suite/modal';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { sortLevels } from '@suite-common/wallet-core';
import { type Account, type FormState } from '@suite-common/wallet-types';
import { Button, Column, Modal } from '@trezor/components';
import type { ComposeOutput, UiRequestSelectFee } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useFees } from 'src/hooks/wallet/form/useFees';

import { TransactionReviewOutputElement } from '../TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputElement';

interface OutputsSummaryProps {
    outputs: ComposeOutput[];
    account: Pick<Account, 'networkType' | 'symbol' | 'tokens'>;
}

export const OutputsSummary = ({ outputs, account }: OutputsSummaryProps) => {
    const intl = useIntl();

    return (
        <Column>
            {outputs.map((output, index) => {
                const lines = [];
                let title = `#${index + 1}`;
                if ('address' in output && output.address) {
                    title = output.address;
                }
                if (output.type === 'opreturn') {
                    title = 'OP_RETURN';
                    lines.push({
                        id: `${index}-data`,
                        value: output.dataHex,
                        type: 'data' as const,
                    });
                } else if (output.type === 'send-max') {
                    lines.push({
                        id: `${index}-amount`,
                        value: intl.formatMessage(messages.AMOUNT_SEND_MAX),
                        type: 'default' as const,
                    });
                } else if (output.amount) {
                    lines.push({
                        id: `${index}-amount`,
                        value: output.amount,
                        type: 'amount' as const,
                    });
                }

                return (
                    <TransactionReviewOutputElement
                        key={index}
                        account={account}
                        lines={lines}
                        title={title}
                        state="active"
                        fiatVisible
                    />
                );
            })}
        </Column>
    );
};

interface SelectAccountModalProps {
    data: UiRequestSelectFee['payload'];
}

export const SelectFeeModal = ({ data }: SelectAccountModalProps) => {
    const dispatch = useDispatch();
    const popupCall = useSelector(selectConnectPopupCall);

    const fees = useMemo(() => data?.feeLevels ?? [], [data]);
    const minFee = data.coinInfo.minFeeSatoshiKb / 1000;
    const maxFee = data.coinInfo.maxFeeSatoshiKb / 1000;
    const account = {
        networkType: 'bitcoin' as const,
        symbol: data.coinInfo.shortcut.toLowerCase() as NetworkSymbol,
        tokens: [],
    };
    const feeInfo = {
        levels: sortLevels(
            fees
                .filter(level => level.fee != '0')
                .filter(level => level.name !== 'low') // this option is hidden in Suite
                .map(level => ({
                    // level.name is just a string instead of enum
                    label: level.name as any,
                    feePerUnit: level.feePerByte!,
                    blocks: level.blocks!,
                })),
        ),
        minFee,
        maxFee,
        minPriorityFee: -1,
        blockHeight: 0,
        blockTime: data.coinInfo.blockTime,
    };

    const methods = useForm<FormState>({
        defaultValues: {
            outputs: [],
        },
    });
    const { changeFeeLevel } = useFees({
        ...methods,
        defaultValue: 'normal',
        feeInfo,
        composeRequest: () => {},
    });
    const {
        handleSubmit,
        formState: { errors },
    } = methods;

    const onSend = handleSubmit(data => {
        const { selectedFee, feePerUnit } = data;
        if (selectedFee === 'custom') {
            dispatch(
                onReceiveFee({
                    type: 'compose-custom',
                    value: feePerUnit,
                }),
            );
        }
        dispatch(
            onReceiveFee({
                type: 'send',
                value: selectedFee || 'normal',
            }),
        );
    });
    const onChangeAccount = () => {
        dispatch(
            onReceiveFee({
                type: 'change-account',
            }),
        );
    };
    const onClose = () => {
        dispatch(onReceiveFee(null));
    };

    return (
        <ConnectModalBackdrop onClick={onClose} canSwitchDevice>
            <Modal.ModalBase
                onCancel={onClose}
                onBackClick={onChangeAccount}
                intent="brand"
                heading={<Translation id="TR_SELECT_FEE" />}
                description={
                    <>
                        <ConnectCallSource />
                    </>
                }
                bottomContent={
                    <>
                        <Button onClick={onSend} isDisabled={!errors} intent="brand">
                            <Translation id="TR_CONTINUE" />
                        </Button>
                        <Button onClick={onClose} intent="neutral" priority="secondary">
                            <Translation id="TR_CANCEL" />
                        </Button>
                    </>
                }
            >
                <FormProvider {...methods}>
                    <Column gap={spacings.md}>
                        {popupCall?.state === 'ongoing' && popupCall?.payload?.outputs && (
                            <OutputsSummary account={account} outputs={popupCall.payload.outputs} />
                        )}
                        <Fees account={account} feeInfo={feeInfo} changeFeeLevel={changeFeeLevel} />
                    </Column>
                </FormProvider>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
