import {
    discoveryActions,
    accountsActions,
    blockchainActions,
    stakeActions,
} from '@suite-common/wallet-core';
import { ArrayElement } from '@trezor/type-utils';

import { ReceiveAction } from 'src/actions/wallet/receiveActions';
import { SignVerifyAction } from 'src/actions/wallet/signVerifyActions';
import { CoinmarketBuyAction } from 'src/actions/wallet/coinmarketBuyActions';
import { CoinmarketExchangeAction } from 'src/actions/wallet/coinmarketExchangeActions';
import { CoinmarketSellAction } from 'src/actions/wallet/coinmarketSellActions';
import { CoinMarketSpendAction } from 'src/actions/wallet/coinmarketSpendActions';
import { CoinmarketP2pAction } from 'src/actions/wallet/coinmarketP2pActions';
import { CoinmarketSavingsAction } from 'src/actions/wallet/coinmarketSavingsActions';
import { CoinmarketCommonAction } from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import { GraphAction } from 'src/actions/wallet/graphActions';
import { SendFormAction } from 'src/actions/wallet/sendFormActions';
import { AccountSearchAction } from 'src/actions/wallet/accountSearchActions';
import { FormDraftAction } from 'src/actions/wallet/formDraftActions';
import { CardanoStakingAction } from 'src/actions/wallet/cardanoStakingActions';
import { PollingAction } from 'src/actions/wallet/pollingActions';
import { CoinjoinAccountAction } from 'src/actions/wallet/coinjoinAccountActions';
import { CoinjoinClientAction } from 'src/actions/wallet/coinjoinClientActions';
import { NETWORKS } from 'src/config/wallet';
import { CoinmarketInfoAction } from 'src/actions/wallet/coinmarketInfoActions';

export type Network = ArrayElement<typeof NETWORKS>;
export type NetworkSymbol = Network['symbol'];
// reexport
export type { Icon } from './iconTypes';
export type { BackendType, CustomBackend } from './backend';
export type { TickerId } from 'src/types/wallet/fiatRates';
export type { Discovery } from '@suite-common/wallet-types';
export type DiscoveryStatusType =
    | {
          status: 'loading';
          type: 'waiting-for-device' | 'auth' | 'auth-confirm' | 'discovery';
      }
    | {
          status: 'exception';
          type:
              | 'auth-failed'
              | 'auth-confirm-failed'
              | 'discovery-empty'
              | 'discovery-failed'
              | 'device-unavailable';
      };
export type {
    Account,
    WalletAccountTransaction,
    RbfTransactionParams,
    ReceiveInfo,
} from '@suite-common/wallet-types';
export type { WalletParams } from 'src/utils/suite/router';

/*
this action union types are bad, we need it only for legacy reason.
(old redux and redux/toolkit action type compatibility e.g. in middlewares)
 */
type AccountsAction = ReturnType<(typeof accountsActions)[keyof typeof accountsActions]>;
type BlockchainAction = ReturnType<(typeof blockchainActions)[keyof typeof blockchainActions]>;
type DiscoveryAction = ReturnType<(typeof discoveryActions)[keyof typeof discoveryActions]>;
type StakeAction = ReturnType<(typeof stakeActions)[keyof typeof stakeActions]>;

export type WalletAction =
    | BlockchainAction
    | ReceiveAction
    | SignVerifyAction
    | GraphAction
    | DiscoveryAction
    | CoinmarketInfoAction
    | CoinmarketExchangeAction
    | CoinmarketBuyAction
    | CoinMarketSpendAction
    | CoinmarketSellAction
    | CoinmarketP2pAction
    | CoinmarketSavingsAction
    | CoinmarketCommonAction
    | SendFormAction
    | AccountSearchAction
    | FormDraftAction
    | CardanoStakingAction
    | PollingAction
    | CoinjoinAccountAction
    | CoinjoinClientAction
    | AccountsAction
    | StakeAction;
