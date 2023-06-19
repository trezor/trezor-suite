import { TrezorDevice } from 'src/types/suite/index';
import { CardanoOutput } from '@trezor/connect';
import { FormState, PrecomposedTransactionFinal, TxFinalCardano } from 'src/types/wallet/sendForm';
import { Account } from 'src/types/wallet/index';
import { getShortFingerprint, isCardanoTx } from 'src/utils/wallet/cardanoUtils';
import { OutputProps } from './components/Output';
import { fromWei } from 'web3-utils';
import { getIsUpdatedSendFlow } from './components/getIsUpdatedSendFlow';

const getCardanoTokenBundle = (account: Account, output: CardanoOutput) => {
    // Transforms cardano's tokenBundle into outputs, 1 output per one token
    // since suite supports only 1 token per output it will return just one item
    if (!output.tokenBundle || output.tokenBundle.length === 0 || 'addressParameters' in output)
        return undefined;

    if (account.tokens) {
        return output.tokenBundle
            .map(policyGroup =>
                policyGroup.tokenAmounts.map(token => {
                    const accountToken = account.tokens!.find(
                        accountToken =>
                            accountToken.contract ===
                            `${policyGroup.policyId}${token.assetNameBytes}`,
                    );
                    if (!accountToken) return;

                    const fingerprint = accountToken.name
                        ? getShortFingerprint(accountToken.name)
                        : undefined;

                    return {
                        type: 'cardano',
                        contract: output.address,
                        balance: token.amount,
                        symbol: token.assetNameBytes
                            ? Buffer.from(token.assetNameBytes, 'hex').toString('utf8')
                            : fingerprint,
                        decimals: accountToken.decimals,
                    };
                }),
            )
            .flat();
    }
};

type ConstructOutputsParams = {
    precomposedTx: TxFinalCardano | PrecomposedTransactionFinal;
    device: TrezorDevice;
    decreaseOutputId: number | undefined;
    account: Account;
    precomposedForm: FormState;
};

const constructOldFlow = ({
    precomposedTx,
    decreaseOutputId,
    account,
    precomposedForm,
}: Omit<ConstructOutputsParams, 'device'>) => {
    const outputs: OutputProps[] = [];

    const isCardano = isCardanoTx(account, precomposedTx);
    const { networkType } = account;

    // used in the bumb fee flow
    if (typeof precomposedTx.useNativeRbf === 'boolean' && precomposedTx.useNativeRbf) {
        outputs.push(
            {
                type: 'txid',
                value: precomposedTx.prevTxid!,
            },
            {
                type: 'fee-replace',
                value: precomposedTx.feeDifference,
                value2: precomposedTx.fee,
            },
        );

        // add decrease output confirmation step between txid and fee
        if (typeof decreaseOutputId === 'number') {
            outputs.splice(1, 0, {
                type: 'reduce-output',
                label: precomposedTx.transaction.outputs[decreaseOutputId].address!,
                value: precomposedTx.feeDifference,
                value2: precomposedTx.transaction.outputs[decreaseOutputId].amount.toString(),
            });
        }
    } else if (isCardano) {
        precomposedTx.transaction.outputs.forEach(o => {
            // iterate only through "external" outputs (change output has addressParameters field instead of address)
            if ('address' in o) {
                const tokenBundle = getCardanoTokenBundle(account, o)?.[0]; // send form supports one token per output

                // each output will include certain amount of ADA (cardano token outputs require ADA)
                outputs.push({
                    type: 'regular_legacy',
                    label: o.address,
                    value: o.amount,
                });

                // if the output also includes a token then we need to render another row with the token
                if (tokenBundle) {
                    outputs.push({
                        type: 'regular_legacy',
                        label: o.address,
                        value: tokenBundle.balance ?? '0',
                        token: tokenBundle,
                    });
                }
            }
        });
    } else {
        precomposedTx.transaction.outputs.forEach(o => {
            if (typeof o.address === 'string') {
                outputs.push({
                    type: 'regular_legacy',
                    label: o.address,
                    value: o.amount.toString(),
                    token: precomposedTx.token,
                });
            } else if (o.script_type === 'PAYTOOPRETURN') {
                outputs.push({
                    type: 'opreturn',
                    value: o.op_return_data,
                });
            }
        });
    }

    if (precomposedForm.bitcoinLockTime) {
        outputs.push({ type: 'locktime', value: precomposedForm.bitcoinLockTime });
    }

    if (precomposedForm.ethereumDataHex && !precomposedTx.token) {
        outputs.push({ type: 'data', value: precomposedForm.ethereumDataHex });
    }

    if (networkType === 'ripple') {
        // ripple displays requests on device in different order:
        // 1. destination tag
        // 2. fee
        // 3. output
        outputs.unshift({ type: 'fee', value: precomposedTx.fee });
        if (precomposedForm.rippleDestinationTag) {
            outputs.unshift({
                type: 'destination-tag',
                value: precomposedForm.rippleDestinationTag,
            });
        }
    } else if (!precomposedTx.useNativeRbf) {
        outputs.push({ type: 'fee', value: precomposedTx.fee });
    }

    return outputs;
};

const constructNewFlow = ({
    precomposedTx,
    decreaseOutputId,
    account,
    precomposedForm,
}: Omit<ConstructOutputsParams, 'device'>) => {
    const outputs: OutputProps[] = [];

    const isCardano = isCardanoTx(account, precomposedTx);
    const { networkType } = account;

    // used in the bumb fee flow
    if (typeof precomposedTx.useNativeRbf === 'boolean' && precomposedTx.useNativeRbf) {
        outputs.push(
            {
                type: 'txid',
                value: precomposedTx.prevTxid!,
            },
            {
                type: 'fee-replace',
                value: precomposedTx.feeDifference,
                value2: precomposedTx.fee,
            },
        );

        // add decrease output confirmation step between txid and fee
        if (typeof decreaseOutputId === 'number') {
            outputs.splice(1, 0, {
                type: 'reduce-output',
                label: precomposedTx.transaction.outputs[decreaseOutputId].address!,
                value: precomposedTx.feeDifference,
                value2: precomposedTx.transaction.outputs[decreaseOutputId].amount.toString(),
            });
        }
    } else if (isCardano) {
        precomposedTx.transaction.outputs.forEach(o => {
            // iterate only through "external" outputs (change output has addressParameters field instead of address)
            if ('address' in o) {
                const tokenBundle = getCardanoTokenBundle(account, o)?.[0]; // send form supports one token per output

                // each output will include certain amount of ADA (cardano token outputs require ADA)
                outputs.push({
                    type: 'regular_legacy',
                    label: o.address,
                    value: o.amount,
                });

                // if the output also includes a token then we need to render another row with the token
                if (tokenBundle) {
                    outputs.push({
                        type: 'regular_legacy',
                        label: o.address,
                        value: tokenBundle.balance ?? '0',
                        token: tokenBundle,
                    });
                }
            }
        });
    } else {
        precomposedTx.transaction.outputs.forEach(o => {
            if (typeof o.address === 'string') {
                if (precomposedTx.token) {
                    outputs.push({ type: 'contract', value: precomposedTx.token.contract });
                }
                outputs.push({ type: 'address', value: o.address });
                outputs.push({
                    type: 'amount',
                    value: o.amount.toString(),
                    token: precomposedTx.token,
                });
            } else if (o.script_type === 'PAYTOOPRETURN') {
                outputs.push({
                    type: 'opreturn',
                    value: o.op_return_data,
                });
            }
        });
    }

    if (networkType === 'ethereum') {
        // formatted to be alligned with the device, feePerByte is stired in Gwei
        outputs.push({
            type: 'gas',
            value: fromWei(precomposedTx.feePerByte, 'Gwei'),
        });
    }

    if (precomposedForm.bitcoinLockTime) {
        outputs.push({ type: 'locktime', value: precomposedForm.bitcoinLockTime });
    }

    if (precomposedForm.ethereumDataHex && !precomposedTx.token) {
        outputs.push({ type: 'data', value: precomposedForm.ethereumDataHex });
    }

    if (networkType === 'ripple' && precomposedForm.rippleDestinationTag) {
        outputs.unshift({
            type: 'destination-tag',
            value: precomposedForm.rippleDestinationTag,
        });
    }

    return outputs;
};

export const constructOutputs = ({ device, ...params }: ConstructOutputsParams) => {
    const isWithUpdatedSendFlow = getIsUpdatedSendFlow(device);

    const outputs = isWithUpdatedSendFlow ? constructNewFlow(params) : constructOldFlow(params);

    return outputs;
};
