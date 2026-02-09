import { useMemo } from 'react';

import { TokenDto, useEnterYieldOpportunity, useSubmitTxHash } from '@suite-common/earn-api';
import { isOrvalHttpError } from '@suite-common/earn-api/src/httpClient';
import { Network, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { selectVisibleDeviceNetworkAccounts } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

interface EnterYieldOpportunityProps {
    yieldId: string;
    network: Network;
    token: TokenDto;
    isDisabled: boolean;
}

export function EnterYieldOpportunity({
    yieldId,
    token,
    network,
    isDisabled,
}: EnterYieldOpportunityProps) {
    const enterYieldOpportunity = useEnterYieldOpportunity();
    const submitTxHash = useSubmitTxHash();
    // select USDC token from all accounts
    const networkAccounts = useSelector(state =>
        selectVisibleDeviceNetworkAccounts(state, network.symbol),
    );
    const walletAccounts = useMemo(
        () =>
            networkAccounts
                .map(account => ({
                    ...account,
                    tokens:
                        account.tokens?.filter(
                            t => t.symbol === token.symbol && new BigNumber(t.balance ?? 0).gt(0),
                        ) ?? [],
                }))
                .filter(account => Boolean(account.tokens?.length))
                .toSorted(
                    (a, b) =>
                        new BigNumber(a.balance ?? 0).comparedTo(new BigNumber(b.balance ?? 0)) ??
                        0,
                ),
        [networkAccounts, token],
    );

    // TODO: select account (address)
    const [firstAccount] = walletAccounts;

    if (walletAccounts.length === 0) {
        return (
            <Button
                intent="brand"
                priority="secondary"
                onClick={() => {
                    alert('TODO: navigate to buy page');
                }}
            >
                Buy
            </Button>
        );
    }

    return (
        <Button
            intent="brand"
            priority="secondary"
            isDisabled={isDisabled}
            onClick={async () => {
                console.log({ walletAccounts });

                const amount = prompt(
                    `#${firstAccount.index + 1} ${getNetworkDisplaySymbolName(firstAccount.symbol)}: Enter amount (max ${firstAccount.tokens[0].balance} ${token.symbol})`,
                );

                if (!amount) return;

                console.log({ firstAccount, token });

                try {
                    const { data } = await enterYieldOpportunity.mutateAsync({
                        yieldId,
                        address: firstAccount.tokens[0].contract,
                        amount: new BigNumber(amount).toString(),
                    });

                    // TODO: sign transaction

                    // TODO: broadcast transaction

                    // await submitTxHash.mutateAsync({
                    //     txId: data.id,
                    //     // TODO: pass tx hash
                    //     txHash: '0x1234567890',
                    // });
                    // console.log(data);
                } catch (error) {
                    if (isOrvalHttpError(error)) {
                        console.error(error.info);
                    } else {
                        console.error(error);
                    }
                }
            }}
            isLoading={enterYieldOpportunity.isPending}
        >
            Enter
        </Button>
    );
}
