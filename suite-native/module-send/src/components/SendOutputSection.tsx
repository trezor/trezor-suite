import { useSelector } from 'react-redux';

import { getNetwork } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    selectAccountNetworkSymbol,
    selectIsAmountInSats,
} from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Box } from '@suite-native/atoms';
import { useFormContext, useWatch } from '@suite-native/forms';
import {
    type NativeSendRootState,
    selectFeeLevelsMaxAmountBySendKey,
} from '@suite-native/transaction-management';

import { SwitchCoinControlButton } from './CoinControl/SwitchCoinControlButton';
import { SendOutputFields } from './SendOutputFields';
import { type SendOutputsFormValues } from '../sendOutputsFormSchema';
import { getSendFormAmountInSubunits } from '../utils';

type SendOutputSectionProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const SendOutputSection = ({ accountKey, tokenContract }: SendOutputSectionProps) => {
    const networkSymbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, networkSymbol ?? undefined),
    );
    const feeLevelsMaxAmount = useSelector((state: NativeSendRootState) =>
        selectFeeLevelsMaxAmountBySendKey(state, accountKey, tokenContract),
    );
    const { control } = useFormContext<SendOutputsFormValues>();
    const formAmount = useWatch({ name: 'outputs.0.amount', control }) ?? '';
    const network = networkSymbol ? getNetwork(networkSymbol) : null;
    const amount = getSendFormAmountInSubunits({
        amount: formAmount,
        decimals: network?.decimals ?? 0,
        isAmountInSats,
    });

    return (
        <Box marginTop="sp32">
            <SendOutputFields
                accountKey={accountKey}
                tokenContract={tokenContract}
                maxAmount={feeLevelsMaxAmount?.normal}
            />
            {network?.networkType === 'bitcoin' && (
                <Box flexDirection="row" justifyContent="center" marginTop="sp24">
                    <SwitchCoinControlButton amount={amount} accountKey={accountKey} />
                </Box>
            )}
        </Box>
    );
};
