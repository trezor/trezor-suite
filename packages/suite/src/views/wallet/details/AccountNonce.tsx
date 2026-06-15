import { useEffect, useState } from 'react';

import { Translation } from '@suite/intl';
import { ethereumGetCurrentNonceThunk } from '@suite-common/wallet-core/src/send/sendFormEthereumThunks';
import { type AccountWithNetworkType } from '@suite-common/wallet-types';
import { Paragraph } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';

type AccountNonceProps = {
    account: AccountWithNetworkType<'ethereum'>;
};

export const AccountNonce = ({ account }: AccountNonceProps) => {
    const dispatch = useDispatch();
    const [nonces, setNonces] = useState<{ nonce: string; confirmedNonce: string }>();

    useEffect(() => {
        const promise = dispatch(
            ethereumGetCurrentNonceThunk({ selectedAccount: account, fetchConfirmedNonce: true }),
        );

        void promise
            .unwrap()
            .then(setNonces)
            .catch(() => {});

        return () => {
            promise.abort();
        };
    }, [account, dispatch]);

    if (!nonces) return null;

    return (
        <>
            <Paragraph typographyStyle="body-sm">
                <Translation id="TR_ACCOUNT_DETAILS_NONCE_CONFIRMED" />
                {': '}
                {nonces.confirmedNonce}
            </Paragraph>
            {nonces.nonce !== nonces.confirmedNonce && (
                <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                    <Translation id="TR_ACCOUNT_DETAILS_NONCE_NEXT" />
                    {': '}
                    {nonces.nonce}
                </Paragraph>
            )}
        </>
    );
};
