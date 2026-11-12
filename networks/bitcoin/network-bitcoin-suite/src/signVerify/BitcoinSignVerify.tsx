import { useState } from 'react';

import { type SignVerifyPage, VerifyMessageForm } from '@suite/sign-verify';
import { verifyBitcoinMessageThunk } from '@suite-common/sign-verify';
import { useServices } from '@trezor/dependency-injection';
import { type SignVerifyProps } from '@trezor/network-module-suite-types';
import { injectDispatch } from '@trezor/redux-utils';

import { BitcoinSignMessageForm } from './BitcoinSignMessageForm';

export const BitcoinSignVerify = ({ account }: SignVerifyProps) => {
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
                verifyMessage={params =>
                    dispatch(verifyBitcoinMessageThunk({ account, ...params }))
                }
            />
        );
    }

    return <BitcoinSignMessageForm key={account.key} account={account} onPageChange={setPage} />;
};
