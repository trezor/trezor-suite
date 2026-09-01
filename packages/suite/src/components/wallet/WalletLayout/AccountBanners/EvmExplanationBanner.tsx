import { Translation } from '@suite/intl';
import { selectRouteName } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { networks } from '@suite-common/wallet-config';

import { closeEvmExplanationBanner } from 'src/actions/suite/suiteActions';
import { useSelector } from 'src/hooks/suite';
import { selectEvmSettings } from 'src/selectors/suite/suiteSelectors';
import { type Account } from 'src/types/wallet';

import { BannerPoints } from './BannerPoints';
import { CloseableBanner } from './CloseableBanner';

interface EvmExplanationBannerProps {
    account?: Account;
}

export const EvmExplanationBanner = ({ account }: EvmExplanationBannerProps) => {
    const { explanationBannerClosed } = useSelector(selectEvmSettings);
    const routeName = useSelector(selectRouteName);
    const dispatch = useDispatch();

    const isReceiveRoute = routeName === 'wallet-receive';

    const isVisible =
        account &&
        !explanationBannerClosed[account.symbol] &&
        account.symbol !== 'eth' &&
        networks[account.symbol].networkType === 'ethereum' &&
        !isReceiveRoute;

    if (!isVisible) {
        return null;
    }

    const network = networks[account.symbol];

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
