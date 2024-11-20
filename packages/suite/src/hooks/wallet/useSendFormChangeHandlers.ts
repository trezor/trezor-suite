import { TokenInfo } from '@trezor/blockchain-link-types';

import { SendContextValues } from 'src/types/wallet/sendForm';

export type HandleAmountChangeParams = {
    outputId: number;
    value: string;
};

export type HandleFiatChangeParams = HandleAmountChangeParams & { token?: TokenInfo };

type UseSendFormChangeHandlersParams = {
    calculateAmountFromFiat: (outputId: number, value: string, token?: TokenInfo) => void;
    calculateFiatFromAmount: (outputId: number, value: string) => void;
    composeRequest: SendContextValues['composeTransaction'];
    setValue: SendContextValues['setValue'];
};

export const useSendFormChangeHandlers = ({
    calculateAmountFromFiat,
    calculateFiatFromAmount,
    composeRequest,
    setValue,
}: UseSendFormChangeHandlersParams) => {
    const disableSetMaxAndRecomposeTransaction = (outputId: number) => {
        setValue('setMaxOutputId', undefined);
        composeRequest(`outputs.${outputId}.amount`);
    };

    const handleAmountChange = ({ outputId, value }: HandleAmountChangeParams) => {
        calculateFiatFromAmount(outputId, value);
        disableSetMaxAndRecomposeTransaction(outputId);
    };

    const handleFiatChange = ({ outputId, token, value }: HandleFiatChangeParams) => {
        calculateAmountFromFiat(outputId, value, token);
        disableSetMaxAndRecomposeTransaction(outputId);
    };

    return { handleAmountChange, handleFiatChange };
};
