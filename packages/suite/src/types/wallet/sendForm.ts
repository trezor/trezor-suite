import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { SEND } from '@wallet-actions/constants';
import { FeeItem } from '@wallet-reducers/feesReducer';
import { Account } from '@wallet-types';

export interface Output {
    id: number;
    address: {
        value: null | string;
        error: null | typeof VALIDATION_ERRORS.IS_EMPTY | typeof VALIDATION_ERRORS.NOT_VALID;
    };
    amount: {
        value: null | string;
        error:
            | null
            | typeof VALIDATION_ERRORS.IS_EMPTY
            | typeof VALIDATION_ERRORS.NOT_NUMBER
            | typeof VALIDATION_ERRORS.NOT_ENOUGH;
    };
    fiatValue: { value: null | string };
    localCurrency: {
        value: { value: string; label: string };
    };
}

export interface State {
    outputs: Output[];
    fee: null | { value: string; label: string };
    customFee: {
        value: null | string;
        error: null | typeof VALIDATION_ERRORS.IS_EMPTY | typeof VALIDATION_ERRORS.NOT_NUMBER;
    };
    isAdditionalFormVisible: boolean;
    networkTypeRipple: {
        destinationTag: null | string;
        errors: {
            destinationTag: null | typeof VALIDATION_ERRORS.NOT_NUMBER;
        };
    };
    networkTypeEthereum: {
        gasLimit: null | string;
        gasPrice: null | string;
        data: null | string;
    };
    networkTypeBitcoin: {};
}

export type Actions =
    | {
          type: typeof SEND.HANDLE_ADDRESS_CHANGE;
          outputId: number;
          address: string;
          symbol: Account['symbol'];
      }
    | {
          type: typeof SEND.HANDLE_AMOUNT_CHANGE;
          outputId: number;
          amount: string;
          availableBalance: string;
      }
    | {
          type: typeof SEND.SET_MAX;
          outputId: number;
      }
    | {
          type: typeof SEND.HANDLE_FIAT_VALUE_CHANGE;
          outputId: number;
          fiatValue: string;
      }
    | {
          type: typeof SEND.HANDLE_FEE_VALUE_CHANGE;
          fee: FeeItem;
      }
    | {
          type: typeof SEND.HANDLE_CUSTOM_FEE_VALUE_CHANGE;
          customFee: string;
      }
    | {
          type: typeof SEND.HANDLE_SELECT_CURRENCY_CHANGE;
          outputId: number;
          localCurrency: Output['localCurrency']['value'];
      }
    | {
          type: typeof SEND.SET_ADDITIONAL_FORM_VISIBILITY;
      }
    | {
          type: typeof SEND.CLEAR;
      };
