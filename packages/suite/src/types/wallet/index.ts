import { type connectPopupActions } from '@suite-common/connect-popup';
import { type tokenDefinitionsActions } from '@suite-common/token-definitions/src/tokenDefinitionsActions';
import {
    type tradingActions,
    type tradingBuyActions,
    type tradingExchangeActions,
    type tradingSellActions,
} from '@suite-common/trading';
import {
    type FormDraftAction,
    type WalletSettingsAction,
    type accountsActions,
    type blockchainActions,
    type discoveryActions,
    type explorerActions,
    type sendFormActions,
    type stakeActions,
} from '@suite-common/wallet-core';

import { type CoinjoinAccountAction } from 'src/actions/wallet/coinjoinAccountActions';
import { type CoinjoinClientAction } from 'src/actions/wallet/coinjoinClientActions';
import { type GraphAction } from 'src/actions/wallet/graphActions';
import { type ReceiveAction } from 'src/actions/wallet/receiveActions';
import { type SignVerifyAction } from 'src/actions/wallet/signVerifyActions';
import { type accountSearchActions } from 'src/reducers/wallet/accountSearchReducer';
import { type yieldActions } from 'src/reducers/wallet/yieldReducer';

// reexport
export type { CustomBackend } from './backend';
export type { TickerId } from 'src/types/wallet/fiatRates';
export type { Discovery } from '@suite-common/wallet-types';

export type DiscoveryStatusType =
    | {
          status: 'loading';
          type: 'waiting-for-device' | 'auth' | 'discovery';
      }
    | {
          status: 'exception';
          type: 'discovery-empty' | 'discovery-failed' | 'device-unavailable';
      };
export type {
    Account,
    WalletAccountTransaction,
    RbfTransactionParams,
    ReceiveInfo,
} from '@suite-common/wallet-types';

export type { WalletParams } from '@suite/router';
export type AccountItemType = 'coin' | 'tokens' | 'staking';

/*
this action union types are bad, we need it only for legacy reason.
(old redux and redux/toolkit action type compatibility e.g. in middlewares)
 */
type TokenDefinitionsAction = ReturnType<
    (typeof tokenDefinitionsActions)[keyof typeof tokenDefinitionsActions]
>;
type AccountsAction = ReturnType<(typeof accountsActions)[keyof typeof accountsActions]>;
type BlockchainAction = ReturnType<(typeof blockchainActions)[keyof typeof blockchainActions]>;
type ExplorerAction = ReturnType<(typeof explorerActions)[keyof typeof explorerActions]>;
type DiscoveryAction = ReturnType<(typeof discoveryActions)[keyof typeof discoveryActions]>;
type StakeAction = ReturnType<(typeof stakeActions)[keyof typeof stakeActions]>;
type SendFormAction = ReturnType<(typeof sendFormActions)[keyof typeof sendFormActions]>;
type TradingAction = ReturnType<(typeof tradingActions)[keyof typeof tradingActions]>;
type TradingBuyAction = ReturnType<(typeof tradingBuyActions)[keyof typeof tradingBuyActions]>;
type TradingExchangeAction = ReturnType<
    (typeof tradingExchangeActions)[keyof typeof tradingExchangeActions]
>;
type TradingSellAction = ReturnType<(typeof tradingSellActions)[keyof typeof tradingSellActions]>;
type ConnectPopupAction = ReturnType<
    (typeof connectPopupActions)[keyof typeof connectPopupActions]
>;
type AccountSearchAction = ReturnType<
    (typeof accountSearchActions)[keyof typeof accountSearchActions]
>;
type YieldAction = ReturnType<(typeof yieldActions)[keyof typeof yieldActions]>;

export type WalletAction =
    | TokenDefinitionsAction
    | BlockchainAction
    | ExplorerAction
    | ReceiveAction
    | SignVerifyAction
    | GraphAction
    | DiscoveryAction
    | TradingAction
    | TradingBuyAction
    | TradingExchangeAction
    | TradingSellAction
    | SendFormAction
    | AccountSearchAction
    | FormDraftAction
    | CoinjoinAccountAction
    | CoinjoinClientAction
    | AccountsAction
    | StakeAction
    | ConnectPopupAction
    | WalletSettingsAction
    | YieldAction;
