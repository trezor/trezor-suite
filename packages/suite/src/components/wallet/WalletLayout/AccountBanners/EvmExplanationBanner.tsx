import { Translation } from '@suite/intl';
import { selectRouteName } from '@suite/router';
import { getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { closeEvmExplanationBanner } from '#src/actions/suite/suiteActions';
import { useSelector } from '#src/hooks/suite/useSelector';
import { selectIsEvmExplanationBannerClosed } from '#src/selectors/suite/suiteSelectors';

import { BannerPoints } from './BannerPoints';
import { CloseableBanner } from './CloseableBanner';

interface EvmExplanationBannerProps {
    account?: Account;
}

export const EvmExplanationBanner = ({ account }: EvmExplanationBannerProps) => {
    const isExplanationBannerClosed = useSelector(
        state => account !== undefined && selectIsEvmExplanationBannerClosed(state, account.symbol),
    );
    const routeName = useSelector(selectRouteName);
    const { dispatch } = useServices(injectDispatch);

    const isReceiveRoute = routeName === 'wallet-receive';

    const isVisible =
        account &&
        !isExplanationBannerClosed &&
        account.symbol !== 'eth' &&
        getNetwork(account.symbol).networkType === 'ethereum' &&
        !isReceiveRoute;

    if (!isVisible) {
        return null;
    }

    const network = getNetwork(account.symbol);

    const close = () => dispatch(closeEvmExplanationBanner(account.symbol));

    const points = [
        <Translation id="TR_EVM_EXPLANATION_DESCRIPTION" key="TR_EVM_EXPLANATION_DESCRIPTION" />,
    ];

    return (
        <CloseableBanner
            onClose={close}
            intent="info"
            title={
                <Translation
                    id="TR_EVM_EXPLANATION_TITLE"
                    values={{
                        network: network.name,
                    }}
                />
            }
            hasIcon={points.length === 1}
        >
            <BannerPoints points={points} />
        </CloseableBanner>
    );
};
