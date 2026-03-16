import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';

import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useSelector } from 'src/hooks/suite/useSelector';

import { BannerPoints } from './BannerPoints';
import { CloseableBanner } from './CloseableBanner';

interface SolanaLimitedHistoryBannerProps {
    account: Account;
}

const SOLANA_TX_HISTORY_LIMIT = 100;

export const SolanaLimitedHistoryBanner = ({ account }: SolanaLimitedHistoryBannerProps) => {
    const dispatch = useDispatch();
    const { solanaLimitedHistoryBannerClosed } = useSelector(selectFlags);

    const isSolanaAccount = account.networkType === 'solana';
    const hasTxCountAboveLimit = account.history.total > SOLANA_TX_HISTORY_LIMIT;

    if (solanaLimitedHistoryBannerClosed || !isSolanaAccount || !hasTxCountAboveLimit) {
        return null;
    }

    const handleClose = () => {
        dispatch(setFlag({ key: 'solanaLimitedHistoryBannerClosed', value: true }));
    };

    const points = [
        <Translation
            id="TR_SOLANA_LIMIT_HISTORY_DESCRIPTION"
            key="TR_SOLANA_LIMIT_HISTORY_DESCRIPTION"
        />,
    ];

    return (
        <CloseableBanner
            onClose={handleClose}
            intent="info"
            title={<Translation id="TR_SOLANA_LIMIT_HISTORY_TITLE" />}
            hasIcon={true}
        >
            <BannerPoints points={points} />
        </CloseableBanner>
    );
};
