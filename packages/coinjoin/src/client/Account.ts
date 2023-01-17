import { Network } from '@trezor/utxo-lib';

import { getScriptPubKeyFromAddress, prefixScriptPubKey } from '../utils/coordinatorUtils';
import { AllowedScriptTypes } from '../types/coordinator';
import { RawLiquidityClue } from '../types/middleware';
import { RegisterAccountParams } from '../types';
import { AccountUtxo, AccountAddress } from '../types/account';

const enhanceAccountUtxo = (
    utxos: Omit<AccountUtxo, 'scriptPubKey'>[],
    network: Network,
    scriptType: AllowedScriptTypes,
): AccountUtxo[] =>
    utxos.flatMap(address => ({
        path: address.path,
        address: address.address,
        scriptPubKey: prefixScriptPubKey(
            getScriptPubKeyFromAddress(address.address, network, scriptType),
            true,
        ),
        outpoint: address.outpoint,
        amount: address.amount,
        anonymityLevel: address.anonymityLevel,
    }));

const enhanceAccountAddresses = (
    addresses: Omit<AccountAddress, 'scriptPubKey'>[],
    network: Network,
    scriptType: AllowedScriptTypes,
): AccountAddress[] =>
    addresses.flatMap(address => ({
        path: address.path,
        address: address.address,
        scriptPubKey: getScriptPubKeyFromAddress(address.address, network, scriptType),
    }));

export class Account {
    accountKey: string;
    scriptType: AllowedScriptTypes;
    network: Network;
    utxos: AccountUtxo[];
    changeAddresses: AccountAddress[];
    targetAnonymity: number;
    maxFeePerKvbyte: number;
    maxCoordinatorFeeRate: number;
    maxRounds: number;
    skipRounds?: [number, number];
    skipRoundCounter = 0;
    signedRounds: string[] = [];
    rawLiquidityClue: RawLiquidityClue;

    constructor(account: RegisterAccountParams, network: Network) {
        this.accountKey = account.accountKey;
        this.network = network;
        this.scriptType = account.scriptType;
        this.utxos = enhanceAccountUtxo(account.utxos, network, account.scriptType);
        this.changeAddresses = enhanceAccountAddresses(
            account.changeAddresses,
            network,
            account.scriptType,
        );
        this.targetAnonymity = account.targetAnonymity;
        this.rawLiquidityClue = account.rawLiquidityClue;
        this.maxFeePerKvbyte = account.maxFeePerKvbyte;
        this.maxCoordinatorFeeRate = account.maxCoordinatorFeeRate;
        this.maxRounds = account.maxRounds;
        this.skipRounds = account.skipRounds;
    }

    update(account: RegisterAccountParams) {
        this.utxos = enhanceAccountUtxo(account.utxos, this.network, account.scriptType);
        this.changeAddresses = enhanceAccountAddresses(
            account.changeAddresses,
            this.network,
            account.scriptType,
        );
        this.targetAnonymity = account.targetAnonymity;
    }

    updateRawLiquidityClue(value: RawLiquidityClue) {
        this.rawLiquidityClue = value;
    }
}
