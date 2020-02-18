import { SEND } from '@wallet-actions/constants';
import { Account } from '@wallet-types';
import { FeeLevel, PrecomposedTransaction } from 'trezor-connect';
import { PrecomposedTransactionXrp, PrecomposedTransactionEth } from './transactions';
import { Output } from './output';
import { InitialState } from './state';
import { VALIDATION_ERRORS } from '@suite/constants/wallet/sendForm';

export type SendFormActions =
    | {
          type: typeof SEND.HANDLE_ADDRESS_CHANGE;
          outputId: number;
          address: string;
          symbol: Account['symbol'];
          networkType: Account['networkType'];
          currentAccountAddress: string;
      }
    | {
          type: typeof SEND.HANDLE_AMOUNT_CHANGE;
          outputId: number;
          amount: string;
          error?: typeof VALIDATION_ERRORS.XRP_CANNOT_SEND_LESS_THAN_RESERVE;
          decimals: number;
          availableBalance: Account['availableBalance'];
      }
    | {
          type: typeof SEND.AMOUNT_LOADING;
          isLoading: boolean;
          outputId: number;
      }
    | {
          type: typeof SEND.SET_MAX;
          outputId: number;
      }
    | { type: typeof SEND.COMPOSE_PROGRESS; isComposing: boolean }
    | {
          type: typeof SEND.HANDLE_FIAT_VALUE_CHANGE;
          outputId: number;
          fiatValue: string;
      }
    | {
          type: typeof SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE;
          customFee: string | null;
      }
    | { type: typeof SEND.HANDLE_FEE_VALUE_CHANGE; fee: FeeLevel }
    | {
          type: typeof SEND.HANDLE_SELECT_CURRENCY_CHANGE;
          outputId: number;
          localCurrency: Output['localCurrency']['value'];
      }
    | {
          type: typeof SEND.HANDLE_SELECT_CURRENCY_CHANGE;
          outputId: number;
          localCurrency: Output['localCurrency']['value'];
      }
    | { type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY }
    | { type: typeof SEND.CLEAR; localCurrency: Output['localCurrency']['value'] }
    | { type: typeof SEND.DELETE_TRANSACTION_INFO; networkType: Account['networkType'] }
    | {
          type: typeof SEND.INIT;
          payload: InitialState;
          localCurrency: Output['localCurrency']['value'];
      }
    | { type: typeof SEND.DISPOSE };

export type SendFormBtcActions =
    | { type: typeof SEND.BTC_ADD_RECIPIENT; newOutput: Output }
    | { type: typeof SEND.BTC_REMOVE_RECIPIENT; outputId: number }
    | { type: typeof SEND.BTC_PRECOMPOSED_TX; payload: PrecomposedTransaction };

export type SendFormXrpActions =
    | { type: typeof SEND.XRP_HANDLE_DESTINATION_TAG_CHANGE; destinationTag: string }
    | { type: typeof SEND.XRP_PRECOMPOSED_TX; payload: PrecomposedTransactionXrp };

export type SendFormEthActions =
    | { type: typeof SEND.ETH_HANDLE_GAS_LIMIT; gasLimit: string }
    | { type: typeof SEND.ETH_HANDLE_GAS_PRICE; gasPrice: string }
    | { type: typeof SEND.ETH_HANDLE_DATA; data: string }
    | { type: typeof SEND.ETH_PRECOMPOSED_TX; payload: PrecomposedTransactionEth };
