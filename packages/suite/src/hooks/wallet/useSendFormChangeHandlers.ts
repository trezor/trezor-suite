import { type TokenInfo } from '@trezor/blockchain-link-types';

import {
    type HandleAmountChangeParams,
    type HandleFiatChangeParams,
    type SendContextValues,
} from '#src/types/wallet/sendForm';

type UseSendFormChangeHandlersParams = {
    calculateCryptoAmountFromBaseCurrencyAmount: (
        outputId: number,
        value: string,
        token?: TokenInfo,
    ) => void;
    calculateBaseCurrencyAmountFromCryptoAmount: (outputId: number, value: string) => void;
    composeRequest: SendContextValues['composeTransaction'];
    setValue: SendContextValues['setValue'];
};

export const useSendFormChangeHandlers = ({
    calculateCryptoAmountFromBaseCurrencyAmount,
    calculateBaseCurrencyAmountFromCryptoAmount,
    composeRequest,
    setValue,
}: UseSendFormChangeHandlersParams) => {
    const disableSetMaxAndRecomposeTransaction = (outputId: number) => {
        setValue('setMaxOutputId', undefined);
        composeRequest(`outputs.${outputId}.amount`);
    };

    const handleAmountChange = ({ outputId, value }: HandleAmountChangeParams) => {
        calculateBaseCurrencyAmountFromCryptoAmount(outputId, value);
        disableSetMaxAndRecomposeTransaction(outputId);
    };

    const handleFiatChange = ({ outputId, token, value }: HandleFiatChangeParams) => {
        calculateCryptoAmountFromBaseCurrencyAmount(outputId, value, token);
        disableSetMaxAndRecomposeTransaction(outputId);
    };

    return { handleAmountChange, handleFiatChange };
};
