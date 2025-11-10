import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { notificationsActions } from '@suite-common/toast-notifications';
import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { fetchAndUpdateAccountThunk, selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { FormState, PrecomposedLevels } from '@suite-common/wallet-types';
import { formatNetworkAmount, getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { BASE_INFO } from '@trezor/blockchain-link-utils/src/stellar';
import { Button, Column, Modal, Row, Text } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { activateTokenThunk } from 'src/actions/wallet/token';
import { Translation } from 'src/components/suite/Translation';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';
import { useFees } from 'src/hooks/wallet/form/useFees';
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

    const network = getNetwork(symbol);
    const resolvedNetworkType = account?.networkType ?? network.networkType;

    const feeInfo = getConvertedOrDefaultFeeInfo({
        networkType: resolvedNetworkType,
        feeInfo: rawFeeInfo,
    });

    const methods = useForm<FormState>({
        mode: 'onChange',
        defaultValues: {
            outputs: [],
            selectedFee: 'normal',
            feePerUnit: '',
        },
    });

    const { changeFeeLevel } = useFees({
        ...methods,
        defaultValue: 'normal',
        feeInfo,
        composeRequest: () => {},
    });

    const { watch, handleSubmit } = methods;

    const selectedFee = watch('selectedFee');
    const feePerUnit = watch('feePerUnit');

    const composedLevels = useMemo(() => {
        const levels: PrecomposedLevels = {};

        const createComposedTx = (feeValue: string) => ({
            type: 'final' as const,
            totalSpent: '0',
            fee: feeValue,
            feePerByte: feeValue,
            bytes: 0,
            inputs: [],
            outputs: [],
            outputsPermutation: [],
        });

        feeInfo.levels.forEach(level => {
            levels[level.label] = createComposedTx(level.feePerUnit);
        });

        if (selectedFee === 'custom' && feePerUnit) {
            levels.custom = createComposedTx(feePerUnit);
        }

        return levels;
    }, [feeInfo.levels, feePerUnit, selectedFee]);

    if (!account) {
        return null;
    }

    const handleActivate = async ({ selectedFee, feePerUnit }: FormState) => {
        const resolvedSelectedFee = selectedFee || 'normal';
        setIsActivating(true);

        try {
            const result = await dispatch(
                activateTokenThunk({
                    account,
                    contractAddress,
                    selectedFee: resolvedSelectedFee,
                    customFeePerUnit: resolvedSelectedFee === 'custom' ? feePerUnit : undefined,
                }),
            );

            analytics.report({
                type: EventType.AddToken,
                payload: {
                    networkSymbol: account.symbol,
                    addedNth: account.tokens?.length ? account.tokens.length + 1 : 1,
                    token: contractAddress,
                },
            });

            if (activateTokenThunk.fulfilled.match(result)) {
                // Success: refresh account and show notification
                await dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
                dispatch(
                    notificationsActions.addToast({
                        type: 'add-token-success',
                    }),
                );
                onCancel(); // Close modal on success
            } else if (activateTokenThunk.rejected.match(result)) {
                // Error: show error notification
                const errorMessage = result.payload?.message || result.error.message;
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: translationString('TR_ADD_TOKEN_TOAST_ERROR', {
                            error: errorMessage,
                        }),
                    }),
                );
            }
        } finally {
            setIsActivating(false);
        }
    };

    const tokenCode = contractAddress.split('-')[0];

    return (
        <Modal
            size="small"
            onCancel={onCancel}
            heading={<Translation id="TR_ACTIVATE_TOKEN" values={{ token: tokenCode }} />}
            bottomContent={
                <Row gap={spacings.xs}>
                    <Button
                        onClick={handleSubmit(handleActivate)}
                        isDisabled={isActivating}
                        isLoading={isActivating}
                    >
                        <Translation id="TR_CONTINUE" />
                    </Button>
                    <Button onClick={onCancel} isDisabled={isActivating}>
                        <Translation id="TR_CANCEL" />
                    </Button>
                </Row>
            }
        >
            <FormProvider {...methods}>
                <Column gap={spacings.lg}>
                    <Text typographyStyle="body" variant="tertiary">
                        <Translation
                            id="TR_TOKEN_ACTIVATION_DESCRIPTION"
                            values={{
                                token: tokenCode,
                                network: getNetwork(symbol).name,
                                reserve: formatNetworkAmount(
                                    BASE_INFO.BASE_RESERVE.toString(),
                                    symbol,
                                    true,
                                ),
                            }}
                        />
                    </Text>

                    <Fees
                        account={account}
                        feeInfo={feeInfo}
                        composedLevels={composedLevels}
                        changeFeeLevel={changeFeeLevel}
                    />
                </Column>
            </FormProvider>
        </Modal>
    );
};
