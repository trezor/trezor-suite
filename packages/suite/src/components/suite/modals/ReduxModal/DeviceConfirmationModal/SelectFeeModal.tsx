import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';

import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { sortLevels } from '@suite-common/wallet-core';
import { Account, FormState } from '@suite-common/wallet-types';
import { Button, Column, Modal } from '@trezor/components';
import type { ComposeOutput, UiRequestSelectFee } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { onReceiveFee } from 'src/actions/suite/modalActions';
import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { Translation } from 'src/components/suite/Translation';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useFees } from 'src/hooks/wallet/form/useFees';
import messages from 'src/support/messages';

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
        control,
        register,
        setValue,
        getValues,
        handleSubmit,
        formState: { isDirty, errors },
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
        <Modal
            onCancel={onClose}
            onBackClick={onChangeAccount}
            variant="primary"
            heading={<Translation id="TR_SELECT_FEE" />}
            description={
                <>
                    <ConnectCallSource />
                </>
            }
            bottomContent={
                <>
                    <Button onClick={onSend} isDisabled={!errors} variant="primary">
                        <Translation id="TR_CONTINUE" />
                    </Button>
                    <Button onClick={onClose} variant="tertiary">
                        <Translation id="TR_CANCEL" />
                    </Button>
                </>
            }
        >
            <Column gap={spacings.md}>
                {popupCall?.state === 'ongoing' && popupCall?.payload?.outputs && (
                    <OutputsSummary account={account} outputs={popupCall.payload.outputs} />
                )}
                <Fees
                    account={account}
                    feeInfo={feeInfo}
                    control={control}
                    register={register}
                    setValue={setValue}
                    getValues={getValues}
                    errors={errors}
                    isDirty={isDirty}
                    changeFeeLevel={changeFeeLevel}
                />
            </Column>
        </Modal>
    );
};
