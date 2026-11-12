import { useMemo, useState } from 'react';

import { signThunk, verifyThunk } from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { SignMessageForm } from '../SignMessageForm';
import { VerifyMessageForm } from '../VerifyMessageForm';
import { type SignVerifyPage } from '../types';

type EthereumSignVerifyProps = {
    account: Account;
};

/** Every EVM account signs with its single address. */
export const EthereumSignVerify = ({ account }: EthereumSignVerifyProps) => {
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
                verifyMessage={({ address, message, signature, hex }) =>
                    dispatch(verifyThunk(account, address, message, signature, hex))
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
                dispatch(signThunk(account, account.path, message, hex))
            }
        />
    );
};
