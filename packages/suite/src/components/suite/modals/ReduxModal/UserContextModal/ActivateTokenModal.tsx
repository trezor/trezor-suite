import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { notificationsActions } from '@suite-common/toast-notifications';
import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { fetchAndUpdateAccountThunk, selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { FormState } from '@suite-common/wallet-types';
import { formatNetworkAmount, getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { BASE_INFO } from '@trezor/blockchain-link-utils/src/stellar';
import { Button, Column, Modal, Row, Text } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { activateTokenThunk } from 'src/actions/wallet/token';
import { Translation } from 'src/components/suite/Translation';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

type ActivateTokenModalProps = {
    symbol: NetworkSymbol;
    contractAddress: string;
    onCancel: () => void;
};

export const ActivateTokenModal = ({
    symbol,
    contractAddress,
    onCancel,
}: ActivateTokenModalProps) => {
    const dispatch = useDispatch();
    const account = useSelector(selectSelectedAccount);
    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, symbol));
    const { translationString } = useTranslation();
    const [isActivating, setIsActivating] = useState(false);

    const {
        register,
        control,
        setValue,
        getValues,
        trigger,
        watch,
        formState: { errors, isDirty },
    } = useForm<FormState>({
        mode: 'onChange',
        defaultValues: {
            selectedFee: 'normal',
            feePerUnit: '',
        },
    });

    const selectedFee = watch('selectedFee');
    const changeFeeLevel = (level: FormState['selectedFee']) => {
        if (selectedFee === level) return;

        setValue('selectedFee', level, { shouldDirty: true });

        if (level === 'custom' && rawFeeInfo) {
            const normalLevel = rawFeeInfo.levels.find(l => l.label === 'normal');
            if (normalLevel?.feePerUnit) {
                setValue('feePerUnit', normalLevel.feePerUnit, { shouldDirty: true });
            }
        }
    };

    const handleActivate = async () => {
        if (!account) return;

        const selectedFeeValue = getValues('selectedFee');
        const customFeePerUnit = getValues('feePerUnit');

        setIsActivating(true);

        let shouldCloseModal = false;

        try {
            const result = await dispatch(
                activateTokenThunk({
                    account,
                    contractAddress,
                    selectedFee: selectedFeeValue || 'normal',
                    customFeePerUnit: selectedFeeValue === 'custom' ? customFeePerUnit : undefined,
                }),
            );

            analytics.report({
                type: EventType.AddToken,
                payload: {
                    networkSymbol: account.symbol,
                    addedNth: account.tokens ? account.tokens.length + 1 : 0,
                    token: contractAddress,
                },
            });

            if (activateTokenThunk.fulfilled.match(result)) {
                // Success - show notification, refresh, then close modal
                await dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
                dispatch(
                    notificationsActions.addToast({
                        type: 'add-token-success',
                    }),
                );
                shouldCloseModal = true;
            } else if (activateTokenThunk.rejected.match(result)) {
                // Error - show error notification
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: translationString('TR_ADD_TOKEN_TOAST_ERROR', {
                            error: result.payload?.message || result.error.message,
                        }),
                    }),
                );
            }
        } finally {
            setIsActivating(false);

            if (shouldCloseModal) {
                onCancel();
            }
        }
    };

    const formIsValid = Object.keys(errors).length === 0;

    if (!account) {
        return null;
    }

    const feeInfo = getConvertedOrDefaultFeeInfo({
        networkType: account.networkType,
        feeInfo: rawFeeInfo,
    });

    return (
        <Modal
            size="small"
            onCancel={onCancel}
            heading={
                <Translation
                    id="TR_ACTIVATE_TOKEN"
                    values={{ token: contractAddress.split('-')[0] }}
                />
            }
            bottomContent={
                <Row gap={spacings.xs}>
                    <Button
                        onClick={handleActivate}
                        isDisabled={!formIsValid || isActivating}
                        isLoading={isActivating}
                    >
                        <Translation id="TR_CONTINUE" />
                    </Button>
                    <Button variant="tertiary" onClick={onCancel} isDisabled={isActivating}>
                        <Translation id="TR_CANCEL" />
                    </Button>
                </Row>
            }
        >
            <Column gap={spacings.lg}>
                <Text typographyStyle="body" variant="tertiary">
                    <Translation
                        id="TR_TOKEN_ACTIVATION_DESCRIPTION"
                        values={{
                            token: contractAddress.split('-')[0],
                            network: getNetwork(symbol).name,
                            reserve: formatNetworkAmount(
                                BASE_INFO.BASE_RESERVE.toString(),
                                symbol,
                                true,
                            ),
                        }}
                    />
                </Text>

                {/* Use standard Fees component */}
                {account && feeInfo && (
                    <Fees
                        account={account}
                        feeInfo={feeInfo}
                        register={register}
                        control={control}
                        setValue={setValue}
                        getValues={getValues}
                        errors={errors}
                        isDirty={isDirty}
                        trigger={trigger}
                        changeFeeLevel={changeFeeLevel}
                    />
                )}
            </Column>
        </Modal>
    );
};
