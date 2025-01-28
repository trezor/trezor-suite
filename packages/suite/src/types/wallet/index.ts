import { tokenDefinitionsActions } from '@suite-common/token-definitions/src/tokenDefinitionsActions';
import {
    accountsActions,
    blockchainActions,
    discoveryActions,
    sendFormActions,
    stakeActions,
} from '@suite-common/wallet-core';

import { AccountSearchAction } from 'src/actions/wallet/accountSearchActions';
import { CardanoStakingAction } from 'src/actions/wallet/cardanoStakingActions';
import { CoinjoinAccountAction } from 'src/actions/wallet/coinjoinAccountActions';
import { CoinjoinClientAction } from 'src/actions/wallet/coinjoinClientActions';
import { FormDraftAction } from 'src/actions/wallet/formDraftActions';
import { GraphAction } from 'src/actions/wallet/graphActions';
import { ReceiveAction } from 'src/actions/wallet/receiveActions';
import { SignVerifyAction } from 'src/actions/wallet/signVerifyActions';
import { TradingCommonAction } from 'src/actions/wallet/trading/tradingCommonActions';
import { TradingBuyAction } from 'src/actions/wallet/tradingBuyActions';
import { TradingExchangeAction } from 'src/actions/wallet/tradingExchangeActions';
import { TradingInfoAction } from 'src/actions/wallet/tradingInfoActions';
import { TradingSellAction } from 'src/actions/wallet/tradingSellActions';

// reexport
export type { Icon } from './iconTypes';
export type { CustomBackend } from './backend';
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
type DiscoveryAction = ReturnType<(typeof discoveryActions)[keyof typeof discoveryActions]>;
type StakeAction = ReturnType<(typeof stakeActions)[keyof typeof stakeActions]>;
type SendFormAction = ReturnType<(typeof sendFormActions)[keyof typeof sendFormActions]>;

export type WalletAction =
    | TokenDefinitionsAction
    | BlockchainAction
    | ReceiveAction
    | SignVerifyAction
    | GraphAction
    | DiscoveryAction
    | TradingInfoAction
    | TradingExchangeAction
    | TradingBuyAction
    | TradingSellAction
    | TradingCommonAction
    | SendFormAction
    | AccountSearchAction
    | FormDraftAction
    | CardanoStakingAction
    | CoinjoinAccountAction
    | CoinjoinClientAction
    | AccountsAction
    | StakeAction;
