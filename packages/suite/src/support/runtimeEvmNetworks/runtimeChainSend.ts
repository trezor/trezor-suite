import { checkAddressChecksum, isEvmAddress, toChecksumAddress } from '@suite-common/address';
import type {
    Account,
    FormState,
    GeneralPrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { isDecimalsValid } from '@suite-common/wallet-utils';
import type { RuntimeEvmNetworkDefinition } from '@trezor/network-ethereum-suite-common';
import {
    type ChainSendAccount,
    convertAmountUnitsToSubunits,
} from '@trezor/network-module-suite-common-types';
import { BigNumber } from '@trezor/utils';

/** The fee levels a runtime network quotes; it has no custom fee. */
export type RuntimeChainFeeLevel = 'normal' | 'high';

/** A composed send, ready to sign: the draft as signed and its fee level. */
export type RuntimeChainSendComposed = {
    formState: FormState;
    precomposedTransaction: GeneralPrecomposedTransactionFinal;
};

type WalletAccountFields = Pick<
    Account,
    'descriptor' | 'index' | 'path' | 'accountType' | 'deviceState'
>;

/**
 * The account a runtime network sends from: a wallet account's address and path under the runtime
 * symbol. Its balance is the runtime network's; nothing of the wallet account's own chain (nonce,
 * tokens, UTXOs) carries over.
 */
export const toRuntimeChainSendAccount = (
    walletAccount: WalletAccountFields,
    definition: Pick<RuntimeEvmNetworkDefinition, 'symbol' | 'decimals'>,
    balance: string,
): ChainSendAccount => {
    const subunits = convertAmountUnitsToSubunits(balance, definition.decimals);

    return {
        symbol: definition.symbol,
        descriptor: walletAccount.descriptor,
        index: walletAccount.index,
        path: walletAccount.path,
        accountType: walletAccount.accountType,
        deviceState: walletAccount.deviceState,
        balance: subunits,
        availableBalance: subunits,
        formattedBalance: balance,
    };
};

export type RuntimeChainSendInput = {
    /** A checked, checksummed recipient. */
    address: string;
    amount: string;
    isMax: boolean;
    selectedFee: RuntimeChainFeeLevel;
};

/** A send of the native coin to one recipient: no token, data, custom nonce or replacement. */
export const createRuntimeChainSendDraft = ({
    address,
    amount,
    isMax,
    selectedFee,
}: RuntimeChainSendInput): FormState => ({
    outputs: [
        {
            type: 'payment',
            address,
            amount: isMax ? '' : amount,
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
            token: null,
        },
    ],
    setMaxOutputId: isMax ? 0 : undefined,
    selectedFee,
    feePerUnit: '',
    feeLimit: '',
    options: ['broadcast'],
    ethereumNonce: '',
    transactionData: '',
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
});

/** The draft as signed: the device signs the amount, so a max send carries the composed max. */
export const withSignedAmount = (draft: FormState, amount: string): FormState => ({
    ...draft,
    outputs: draft.outputs.map((output, index) => (index === 0 ? { ...output, amount } : output)),
});

export type RuntimeRecipientCheck = { address: string } | { error: string };

// Runtime EVM networks are a debug feature; its texts are not translated yet.
export const checkRuntimeRecipient = (input: string): RuntimeRecipientCheck => {
    const address = input.trim();

    if (!isEvmAddress(address))
        return { error: 'Enter an EVM address (0x followed by 40 hex digits).' };
    // A mixed-case address carries a checksum; a wrong one means a typo.
    const hex = address.slice(2);
    const isMixedCase = hex !== hex.toLowerCase() && hex !== hex.toUpperCase();
    if (isMixedCase && !checkAddressChecksum(address)) {
        return { error: 'The address checksum does not match. Check the address.' };
    }

    return { address: toChecksumAddress(address) };
};

export const checkRuntimeAmount = (amount: string, decimals: number): string | undefined => {
    if (!amount) return 'Enter an amount.';
    if (!isDecimalsValid(amount, decimals))
        return `Enter a number with at most ${decimals} decimals.`;
    if (new BigNumber(amount).lte(0)) return 'Enter an amount above zero.';

    return undefined;
};
