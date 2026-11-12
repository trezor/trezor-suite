import { useMemo, useState } from 'react';

import { SignMessageForm, type SignVerifyPage, VerifyMessageForm } from '@suite/sign-verify';
import { signEthereumMessageThunk, verifyEthereumMessageThunk } from '@suite-common/sign-verify';
import { useServices } from '@trezor/dependency-injection';
import { type SignVerifyProps } from '@trezor/network-module-suite-types';
import { injectDispatch } from '@trezor/redux-utils';

/** One module serves every EVM network: an account signs with its single address. */
export const EthereumSignVerify = ({ account }: SignVerifyProps) => {
    const [page, setPage] = useState<SignVerifyPage>('sign');

    const { dispatch } = useServices(injectDispatch);

    const accountAddress = useMemo(
        () => ({ path: account.path, address: account.descriptor }),
        [account.path, account.descriptor],
    );
    const addresses = useMemo(() => [accountAddress], [accountAddress]);

    // Each tab of each account is a form of its own: keying it throws away everything the previous
    // one was in the middle of, including the outcome it had reached.
    if (page === 'verify') {
        return (
            <VerifyMessageForm
                key={account.key}
                symbol={account.symbol}
                onPageChange={setPage}
                verifyMessage={params =>
                    dispatch(verifyEthereumMessageThunk({ account, ...params }))
                }
            />
        );
    }

    return (
        <SignMessageForm
            key={account.key}
            symbol={account.symbol}
            addresses={addresses}
            isAddressSelectable={false}
            defaultAddress={accountAddress}
            canVerify
            onPageChange={setPage}
            signMessage={({ message, hex }) =>
                dispatch(signEthereumMessageThunk({ account, message, hex }))
            }
        />
    );
};
