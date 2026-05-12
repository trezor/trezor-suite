import type { CryptoId } from 'invity-api';

import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { Button } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { StellarManageTokenModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/StellarManageTokenModal';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { useTradingStellarActivateToken } from './useTradingStellarActivateToken';

type Params = {
    account: Account | undefined;
    receiveCryptoId: CryptoId | undefined;
};

export const useTradingStellarActivation = ({ account, receiveCryptoId }: Params) => {
    const { inactiveToken, modal } = useTradingStellarActivateToken({ account, receiveCryptoId });
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint(breakpoints.tablet);

    if (!inactiveToken || !account) {
        return { stellarActivateButton: null, stellarActivateModal: null };
    }

    const stellarActivateButton = (
        <Button
            intent="brand"
            margin={{ top: 16 }}
            size="large"
            minWidth={160}
            width={isContentBelowBreakpoint ? undefined : '100%'}
            onClick={modal.onOpen}
            isDisabled={!account.symbol}
        >
            <Translation id="TR_ACTIVATE_TOKEN" values={{ token: inactiveToken.symbol }} />
        </Button>
    );

    const stellarActivateModal = modal.isOpen ? (
        <StellarManageTokenModal
            mode="activate"
            account={account}
            symbol={account.symbol}
            contractAddress={inactiveToken.contract}
            onCancel={modal.onClose}
        />
    ) : null;

    return { stellarActivateButton, stellarActivateModal };
};
