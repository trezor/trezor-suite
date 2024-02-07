import { Translation } from 'src/components/suite';
import { CloseableBanner } from './CloseableBanner';
import { Account } from 'src/types/wallet';
import { networks } from '@suite-common/wallet-config';
import { useSelector } from 'src/hooks/suite/useSelector';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { SUITE } from 'src/actions/suite/constants';
import { BannerPoints } from './BannerPoints';

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
        >
            <BannerPoints
                points={[
                    <Translation
                        id="TR_EVM_EXPLANATION_DESCRIPTION"
                        key="TR_EVM_EXPLANATION_DESCRIPTION"
                    />,
                ]}
            />
        </CloseableBanner>
    );
};
