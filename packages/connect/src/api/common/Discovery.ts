// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/Discovery.js

import EventEmitter from 'events';
import { PROTO, ERRORS } from '../../constants';
import { Blockchain } from '../../backend/BlockchainLink';
import { DeviceCommands } from '../../device/DeviceCommands';
import { getAccountAddressN } from '../../utils/accountUtils';
import { formatAmount } from '../../utils/formatUtils';
import type { CoinInfo, DiscoveryAccountType, DiscoveryAccount } from '../../types';
import type { GetAccountInfo } from '../../types/api/getAccountInfo';

type DiscoveryType = {
    type: DiscoveryAccountType;
    getPath: (index: number) => number[];
};

type DiscoveryOptions = {
    blockchain: Blockchain;
    commands: DeviceCommands;
    limit?: number;
    derivationType?: PROTO.CardanoDerivationType;
};

export class Discovery extends EventEmitter {
    types: DiscoveryType[] = [];

    typeIndex: number;

    accounts: DiscoveryAccount[];

    coinInfo: CoinInfo;

    blockchain: Blockchain;

    commands: DeviceCommands;

    index: number;

    interrupted: boolean;

    completed: boolean;

    derivationType?: PROTO.CardanoDerivationType;

    constructor(options: DiscoveryOptions) {
        super();

        this.accounts = [];
        this.index = 0;
        this.typeIndex = 0;
        this.interrupted = false;
        this.completed = false;
        this.blockchain = options.blockchain;
        this.commands = options.commands;
        this.coinInfo = options.blockchain.coinInfo;
        this.derivationType = options.derivationType;
        const { coinInfo } = this;

        // set discovery types
        if (coinInfo.type === 'bitcoin') {
            // Bitcoin-like coins could have multiple discovery types (bech32/p2wpkh, taproot/p2tr, segwit/p2sh, legacy/p2pkh)
            // path utility wrapper. bip44 purpose can be set as well
            const getDescriptor = (purpose: number, index: number) =>
                getAccountAddressN(coinInfo, index, { purpose });
            // add bech32/p2wpkh discovery type
            if (coinInfo.xPubMagicSegwitNative) {
                this.types.push({
                    type: 'p2wpkh',
                    getPath: getDescriptor.bind(this, 84),
                });
            }
            // if (coinInfo.taproot) {
            // TODO: enable taproot/p2tr discovery type in popup
            // this.types.push({
            //     type: 'p2tr',
            //     getPath: getDescriptor.bind(this, 86),
            // });
            // }
            // add segwit/p2sh discovery type (normal if bech32 is not supported)
            if (coinInfo.xPubMagicSegwit) {
                this.types.push({
                    type: 'p2sh',
                    getPath: getDescriptor.bind(this, 49),
                });
            }
            // add legacy/p2pkh discovery type (normal if bech32 and segwit are not supported)
            this.types.push({
                type: 'p2pkh',
                getPath: getDescriptor.bind(this, 44),
            });
        } else {
            // other coins has only legacy/p2pkh discovery type
            this.types.push({
                type: 'p2pkh',
                getPath: getAccountAddressN.bind(this, coinInfo),
            });
        }
    }

    async start(details?: GetAccountInfo['details']) {
        const limit = 10; // TODO: move to options
        this.interrupted = false;
        while (!this.completed && !this.interrupted) {
            const accountType = this.types[this.typeIndex];
            const label = `Account #${this.index + 1}`;
            const overTheLimit = this.index >= limit;

            // get descriptor from device
            const path = accountType.getPath(this.index);
            const descriptor = await this.commands.getAccountDescriptor(
                this.coinInfo,
                path,
                this.derivationType,
            );

            if (!descriptor) {
                throw ERRORS.TypedError('Runtime', 'Discovery: descriptor not found');
            }
            if (this.interrupted) return;

            const account: DiscoveryAccount = {
                ...descriptor,
                type: accountType.type,
                label,
            };

            // remove duplicates (restore uncompleted discovery)
            this.accounts = this.accounts.filter(a => a.descriptor !== account.descriptor);

            // if index is below visible limit
            // add incomplete account info (without balance) and emit "progress"
            // this should render "Loading..." status
            if (!overTheLimit) {
                this.accounts.push(account);
                this.emit('progress', this.accounts);
            }

            // get account info from backend
            const info = await this.blockchain.getAccountInfo({
                descriptor: account.descriptor,
                details,
            });
            if (this.interrupted) return;

            // remove previously added incomplete account info
            this.accounts = this.accounts.filter(a => a.descriptor !== account.descriptor);

            // check if account should be displayed
            // eg: empty account with index 11 should not be rendered
            if (!overTheLimit || (overTheLimit && !info.empty)) {
                const balance = formatAmount(info.availableBalance, this.coinInfo);
                this.accounts.push({
                    ...account,
                    empty: info.empty,
                    balance,
                    addresses: info.addresses,
                });
                this.emit('progress', this.accounts);
            }

            // last account was empty. switch to next discovery type or complete the discovery process
            if (info.empty) {
                if (this.typeIndex + 1 < this.types.length) {
                    this.typeIndex++;
                    this.index = 0;
                } else {
                    this.emit('complete');
                    this.completed = true;
                }
            } else {
                this.index++;
            }
        }
    }

    stop() {
        this.interrupted = !this.completed;
    }

    dispose() {
        this.accounts = [];
    }
}
