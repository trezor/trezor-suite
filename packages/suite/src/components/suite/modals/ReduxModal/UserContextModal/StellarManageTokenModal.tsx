import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { events } from '@suite/analytics';
import { Translation, useTranslation } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    activateStellarTokenThunk,
    deactivateStellarTokenThunk,
    fetchAndUpdateAccountThunk,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { FormState } from '@suite-common/wallet-types';
import { formatNetworkAmount, getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { BASE_INFO } from '@trezor/blockchain-link-stellar/src/utils';
import { Banner, Button, Column, Modal, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useComposedLevelsPlaceholder } from 'src/hooks/wallet/form/useComposedLevelsPlaceholder';
import { useFees } from 'src/hooks/wallet/form/useFees';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useAnalytics } from 'src/support/useAnalytics';

type StellarManageTokenModalProps =
    | {
          mode: 'activate';
          symbol: NetworkSymbol;
          contractAddress: string;
          onCancel: () => void;
      }
    | {
          mode: 'deactivate';
          symbol: NetworkSymbol;
          contractAddress: string;
          tokenBalance: string;
          onCancel: () => void;
      };

export const StellarManageTokenModal = (props: StellarManageTokenModalProps) => {
    const analytics = useAnalytics();
    const { mode, symbol, contractAddress, onCancel } = props;
    const tokenBalance = mode === 'deactivate' ? props.tokenBalance : undefined;
    const dispatch = useDispatch();
    const account = useSelector(selectSelectedAccount);
    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, symbol));
    const { translationString } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);

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

    const composedLevels = useComposedLevelsPlaceholder({
        feeInfo,
        selectedFee,
        feePerUnit,
    });

    const composedTx = composedLevels[selectedFee || 'normal'];
    const currentFee = composedTx?.type === 'final' ? composedTx.fee : '0';

    // Check if balance is sufficient for activation (need fee + BASE_RESERVE for new trustline)
    const insufficientBalanceInfo = useMemo(() => {
        if (mode !== 'activate' || !account) {
            return null;
        }
        const availableBalance = BigNumber(account.availableBalance);
        const requiredAmount = BigNumber(currentFee).plus(BASE_INFO.BASE_RESERVE);

        if (availableBalance.lt(requiredAmount)) {
            return {
                required: formatNetworkAmount(requiredAmount.toString(), symbol, true),
                available: formatNetworkAmount(availableBalance.toString(), symbol, true),
            };
        }

        return null;
    }, [mode, account, currentFee, symbol]);

    if (!account) {
        return null;
    }

    const tokenCode = contractAddress.split('-')[0];

    // For deactivation, check balance first and show warning if not zero
    if (mode === 'deactivate' && tokenBalance && !BigNumber(tokenBalance).isZero()) {
        return (
            <Modal
                width={600}
                onCancel={onCancel}
                heading={<Translation id="TR_CANT_DEACTIVATE_TOKEN_WITH_BALANCE" />}
                bottomContent={
                    <Button onClick={onCancel} intent="brand">
                        <Translation id="TR_GOT_IT" />
                    </Button>
                }
            >
                <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                    <Translation id="TR_DEACTIVATE_TOKEN_BALANCE_WARNING" />
                </Text>
            </Modal>
        );
    }

    const handleSubmitTrustline = async ({ selectedFee, feePerUnit }: FormState) => {
        const resolvedSelectedFee = selectedFee || 'normal';
        setIsProcessing(true);

        try {
            const thunkPayload = {
                account,
                contractAddress,
                selectedFee: resolvedSelectedFee,
                customFeePerUnit: resolvedSelectedFee === 'custom' ? feePerUnit : undefined,
            };

            const thunk =
                mode === 'activate' ? activateStellarTokenThunk : deactivateStellarTokenThunk;
            const result = await dispatch(thunk(thunkPayload));

            const isSuccess = thunk.fulfilled.match(result);
            const isError = thunk.rejected.match(result);

            if (isSuccess) {
                // Refresh current account data to reflect the changes
                await dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));

                if (mode === 'activate') {
                    // Automatically show the activated token in the "Tokens" tab after the user activates a token
                    dispatch(
                        tokenDefinitionsActions.setTokenStatus({
                            symbol: account.symbol,
                            contractAddress,
                            status: TokenManagementAction.SHOW,
                            type: DefinitionType.COIN,
                        }),
                    );

                    analytics.report({
                        type: events.addTokenEvent.name,
                        payload: {
                            networkSymbol: account.symbol,
                            addedNth: account.tokens?.length ? account.tokens.length + 1 : 1,
                            token: contractAddress,
                        },
                    });

                    dispatch(
                        notificationsActions.addToast({
                            type: 'activate-token-success',
                        }),
                    );
                } else {
                    analytics.report({
                        type: events.removeTokenEvent.name,
                        payload: {
                            networkSymbol: account.symbol,
                            token: contractAddress,
                        },
                    });

                    dispatch(
                        notificationsActions.addToast({
                            type: 'deactivate-token-success',
                        }),
                    );
                }

                onCancel();
            } else if (isError) {
                const errorMessage = result.payload?.message || 'Unknown error';
                const errorTranslationId =
                    mode === 'activate'
                        ? 'TR_ACTIVATE_TOKEN_TOAST_ERROR'
                        : 'TR_DEACTIVATE_TOKEN_TOAST_ERROR';

                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: translationString(errorTranslationId, {
                            error: errorMessage,
                        }),
                    }),
                );
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const headingId = mode === 'activate' ? 'TR_ACTIVATE_TOKEN' : 'TR_DEACTIVATE_TOKEN_HEADING';
    const descriptionId =
        mode === 'activate'
            ? 'TR_TOKEN_ACTIVATION_DESCRIPTION'
            : 'TR_TOKEN_DEACTIVATION_DESCRIPTION';

    return (
        <Modal
            width={600}
            onCancel={onCancel}
            heading={<Translation id={headingId} values={{ token: tokenCode }} />}
            bottomContent={
                <Row gap={spacings.xs}>
                    <Button
                        onClick={handleSubmit(handleSubmitTrustline)}
                        isDisabled={isProcessing || !!insufficientBalanceInfo}
                        isLoading={isProcessing}
                        intent="brand"
                    >
                        <Translation id="TR_CONTINUE" />
                    </Button>
                    <Button
                        onClick={onCancel}
                        isDisabled={isProcessing}
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="TR_CANCEL" />
                    </Button>
                </Row>
            }
        >
            <FormProvider {...methods}>
                <Column gap={spacings.lg}>
                    <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                        {mode === 'activate' ? (
                            <Translation
                                id={descriptionId}
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
                        ) : (
                            <Translation id={descriptionId} />
                        )}
                    </Text>

                    <Fees
                        account={account}
                        feeInfo={feeInfo}
                        composedLevels={composedLevels}
                        changeFeeLevel={changeFeeLevel}
                    />

                    {insufficientBalanceInfo && (
                        <Banner
                            intent="warning"
                            icon="warning"
                            description={
                                <Translation
                                    id="TR_TOKEN_ACTIVATION_INSUFFICIENT_FUNDS"
                                    values={{
                                        required: insufficientBalanceInfo.required,
                                        available: insufficientBalanceInfo.available,
                                    }}
                                />
                            }
                        />
                    )}
                </Column>
            </FormProvider>
        </Modal>
    );
};
