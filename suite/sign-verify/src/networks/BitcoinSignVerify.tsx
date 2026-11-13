import { useState } from 'react';

import { verifyThunk } from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { BitcoinSignMessageForm } from './BitcoinSignMessageForm';
import { VerifyMessageForm } from '../VerifyMessageForm';
import { type SignVerifyPage } from '../types';

type BitcoinSignVerifyProps = {
    account: Account;
};

export const BitcoinSignVerify = ({ account }: BitcoinSignVerifyProps) => {
    const [page, setPage] = useState<SignVerifyPage>('sign');

    const { dispatch } = useServices(injectDispatch);

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

    return <BitcoinSignMessageForm key={account.key} account={account} onPageChange={setPage} />;
};
