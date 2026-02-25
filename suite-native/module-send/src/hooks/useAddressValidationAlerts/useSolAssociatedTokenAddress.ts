import { useState } from 'react';

import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { isProgramDerivedAccount } from '@suite-common/wallet-utils';
import { useFormContext } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import TrezorConnect from '@trezor/connect';

export const useSolAssociatedTokenAddress = () => {
    const [isSolATA, setIsSolATA] = useState(false);
    const { translate } = useTranslate();
    const { setError } = useFormContext();

    const checkSolAssociatedTokenAddress = async ({
        value,
        symbol,
        fieldName,
    }: {
        value: string;
        symbol: NetworkSymbol;
        fieldName: string;
    }) => {
        const networkType = getNetworkType(symbol);
        if (networkType !== 'solana') return;
        const response = await TrezorConnect.getAccountInfo({
            descriptor: value,
            coin: symbol,
            details: 'basic',
        });

        if (!response.success) {
            setError(fieldName, {
                message: translate(
                    'moduleSend.outputs.recipients.solAssociatedAccountAddress.alert.title',
                ),
            });

            setIsSolATA(false);

            return;
        }

        setIsSolATA(isProgramDerivedAccount(response.payload));
    };

    return { isSolATA, checkSolAssociatedTokenAddress };
};
