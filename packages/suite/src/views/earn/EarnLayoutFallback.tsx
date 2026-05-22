import { Translation } from '@suite/intl';
import { Column, Spinner } from '@trezor/components';

import { EarnException } from 'src/components/earn';
import { type EarnLayoutFallbackState } from 'src/types/earn/earnLayout';

type EarnLayoutFallbackProps = {
    layoutState: EarnLayoutFallbackState;
};

export const EarnLayoutFallback = ({ layoutState }: EarnLayoutFallbackProps) => {
    if (layoutState.status === 'loading') {
        return (
            <Column alignItems="center" padding={{ vertical: 80 }}>
                <Spinner size={48} />
            </Column>
        );
    }

    switch (layoutState.reason) {
        case 'missing-route-params':
            return null;
        case 'missing-account':
            return (
                <EarnException
                    title={<Translation id="TR_ACCOUNT_EXCEPTION_NOT_EXIST" />}
                    iconName="cloud"
                />
            );
        case 'missing-vault':
            return <EarnException title={<Translation id="TR_EARN_YIELD_VAULT_NOT_EXIST" />} />;
        case 'network-mismatch':
            return (
                <EarnException title={<Translation id="TR_EARN_YIELD_NETWORK_NOT_SUPPORTED" />} />
            );
        case 'token-mismatch':
            return <EarnException title={<Translation id="TR_EARN_YIELD_TOKEN_NOT_EXIST" />} />;
        case 'yield-opportunities-error':
            return <EarnException title={<Translation id="TR_EARN_YIELD_OPPORTUNITIES_ERROR" />} />;
    }
};
