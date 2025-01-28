import { networks } from '@suite-common/wallet-config';

import { SUITE } from 'src/actions/suite/constants';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useSelector } from 'src/hooks/suite/useSelector';
import { Account } from 'src/types/wallet';

import { BannerPoints } from './BannerPoints';
import { CloseableBanner } from './CloseableBanner';

interface EvmExplanationBannerProps {
    account?: Account;
}

export const EvmExplanationBanner = ({ account }: EvmExplanationBannerProps) => {
    const { explanationBannerClosed } = useSelector(state => state.suite.evmSettings);
    const dispatch = useDispatch();

    const isVisible =
        account &&
        !explanationBannerClosed[account.symbol] &&
        account.symbol !== 'eth' &&
        networks[account.symbol].networkType === 'ethereum';

    if (!isVisible) {
        return null;
    }

    const network = networks[account.symbol];

    const close = () =>
        dispatch({
            type: SUITE.EVM_CLOSE_EXPLANATION_BANNER,
            symbol: account?.symbol,
        });

    const points = [
        <Translation id="TR_EVM_EXPLANATION_DESCRIPTION" key="TR_EVM_EXPLANATION_DESCRIPTION" />,
    ];

    return (
        <CloseableBanner
            onClose={close}
            variant="info"
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
