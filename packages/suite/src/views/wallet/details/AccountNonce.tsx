import { Translation } from '@suite/intl';
import { useEvmNonceInfo } from '@suite-common/wallet-core';
import { type AccountWithNetworkType } from '@suite-common/wallet-types';
import { Paragraph, Skeleton } from '@trezor/components';

type AccountNonceProps = {
    account: AccountWithNetworkType<'ethereum'>;
};

export const AccountNonce = ({ account }: AccountNonceProps) => {
    const { nonceInfo, isLoading } = useEvmNonceInfo(account);

    if (isLoading) return <Skeleton width={80} height={16} />;

    if (!nonceInfo) return null;

    return (
        <>
            <Paragraph typographyStyle="body-sm">
                <Translation id="TR_ACCOUNT_DETAILS_NONCE_CONFIRMED" />
                {': '}
                {nonceInfo.confirmedNonce}
            </Paragraph>
            {nonceInfo.nextNonce !== nonceInfo.confirmedNonce && (
                <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                    <Translation id="TR_ACCOUNT_DETAILS_NONCE_NEXT" />
                    {': '}
                    {nonceInfo.nextNonce}
                </Paragraph>
            )}
        </>
    );
};
