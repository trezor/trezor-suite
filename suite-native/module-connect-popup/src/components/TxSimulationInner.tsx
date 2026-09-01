import { useState } from 'react';

import { type ConnectCallSource, connectPopupActions } from '@suite-common/connect-popup';
import { useDispatch } from '@suite-common/redux-utils';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { type Account, type TxSimulationAction } from '@suite-common/wallet-types';
import { AccountsListItem } from '@suite-native/accounts';
import { Button, Card, HStack, Text, TitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { EvmTxSimulationReviewContent } from '@suite-native/tx-simulation';
import { ERRORS } from '@trezor/connect-common/src/constants';

import { ConnectAppIcon } from './ConnectAppIcon';

interface TxSimulationInnerProps {
    action: TxSimulationAction;
    account: Account;
    source: ConnectCallSource;
}

export function TxSimulationInner({ action, account, source }: TxSimulationInnerProps) {
    const dispatch = useDispatch();

    // Fees
    const defaultGasLimit =
        action.method === 'ethereumSignTransaction'
            ? action.payload.transaction.gasLimit
            : ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT;
    const [gasLimit, setGasLimit] = useState(defaultGasLimit);
    const isSigningTransaction = action.method === 'ethereumSignTransaction';

    const onConfirm = () => {
        if (isSigningTransaction) {
            // TODO add fee selection
            const { maxFeePerGas, maxPriorityFeePerGas, gasPrice } = action.payload.transaction;

            if (maxFeePerGas && maxPriorityFeePerGas) {
                dispatch(
                    connectPopupActions.setSelectedFee({
                        selectedFee: {
                            gasLimit,
                            gasPrice: undefined,
                            maxFeePerGas,
                            maxPriorityFeePerGas,
                        },
                    }),
                );
            } else if (gasPrice) {
                dispatch(
                    connectPopupActions.setSelectedFee({
                        selectedFee: {
                            gasLimit,
                            gasPrice,
                            maxFeePerGas: undefined,
                            maxPriorityFeePerGas: undefined,
                        },
                    }),
                );
            }
        }
        dispatch(connectPopupActions.approvePermissions());
    };
    const onCancel = () => {
        dispatch(connectPopupActions.rejectPermissions(ERRORS.TypedError('Method_Cancel')));
    };

    return (
        <VStack testID="@popup/tx-simulation" spacing="sp16" flex={1}>
            <TitleHeader
                title={<Translation id="moduleConnectPopup.simulation.reviewTransaction" />}
            />

            <Card noPadding>
                <HStack alignItems="center" spacing="sp16" padding="sp12">
                    <ConnectAppIcon
                        src={source.manifest?.appIcon}
                        type="trezorConnect"
                        size="medium"
                    />
                    <VStack flex={1} spacing="sp4">
                        <Text>{source.manifest?.appName ?? source.origin}</Text>
                        {source.manifest?.appName && (
                            <Text color="contentSecondary">{source.origin}</Text>
                        )}
                    </VStack>
                </HStack>
            </Card>

            <VStack>
                <Text>
                    <Translation id="moduleConnectPopup.walletConnect.selectedAccount" />
                </Text>
                <Card noPadding>
                    <AccountsListItem account={account} />
                </Card>
            </VStack>

            <EvmTxSimulationReviewContent
                action={action}
                afterSimulation={
                    <Text variant="body-sm">
                        <Translation
                            id="moduleConnectPopup.simulation.simulationPoweredBy"
                            values={{ provider: 'Blockaid' }}
                        />
                    </Text>
                }
                areAssetDividersDisplayed={false}
                assetVariant="wrap"
                cancelButton={
                    <Button
                        testID="@popup/cancel-simulation"
                        onPress={onCancel}
                        intent="neutral"
                        priority="secondary"
                    >
                        <Translation id="generic.buttons.cancel" />
                    </Button>
                }
                confirmTestID="@popup/confirm-simulation"
                insufficientGasWarning={{
                    transaction: isSigningTransaction ? action.payload.transaction : undefined,
                    gasLimit,
                    accountBalance: account.balance,
                    networkSymbol: account.symbol,
                }}
                onConfirm={onConfirm}
                onSuccess={({ method, payload }) => {
                    switch (method) {
                        case 'ethereumSignTransaction':
                        case 'ethereumSignTypedData': {
                            const { simulation: evmSimulation, gas_estimation } = payload;
                            const newFeeLimit =
                                gas_estimation?.status === 'Success'
                                    ? Number(gas_estimation.estimate).toString()
                                    : null;

                            if (
                                evmSimulation?.status === 'Success' &&
                                newFeeLimit &&
                                newFeeLimit !== defaultGasLimit
                            ) {
                                setGasLimit(newFeeLimit);
                            }

                            break;
                        }
                    }
                }}
                title={
                    <Text>
                        <Translation id="moduleConnectPopup.simulation.simulation" />
                    </Text>
                }
            />
        </VStack>
    );
}
