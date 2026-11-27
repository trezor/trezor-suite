import { useState } from 'react';

import { type Network } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { SignVerifyForm } from './SignVerifyForm';
import { type SignVerifyPage } from './types';

type SignVerifyProps = {
    account: Account;
    network?: Network;
};

export const SignVerify = ({ account, network }: SignVerifyProps) => {
    const [page, setPage] = useState<SignVerifyPage>('sign');

    return (
        // Each tab of each account is a form of its own: keying it throws away everything the
        // previous one was in the middle of, including the outcome it had reached.
        <SignVerifyForm
            key={`${page}-${account.key}`}
            account={account}
            network={network}
            page={page}
            onPageChange={setPage}
        />
    );
};
