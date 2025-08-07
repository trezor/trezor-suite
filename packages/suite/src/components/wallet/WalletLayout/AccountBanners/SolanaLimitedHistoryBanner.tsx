import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectSuiteFlags } from 'src/selectors/suite/suiteSelectors';

import { BannerPoints } from './BannerPoints';
import { CloseableBanner } from './CloseableBanner';

export const SolanaLimitedHistoryBanner = () => {
    const dispatch = useDispatch();
    const { solanaLimitedHistoryBannerClosed } = useSelector(selectSuiteFlags);

    if (solanaLimitedHistoryBannerClosed) {
        return null;
    }

    const handleClose = () => {
        dispatch(setFlag('solanaLimitedHistoryBannerClosed', true));
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
            variant="info"
            title={<Translation id="TR_SOLANA_LIMIT_HISTORY_TITLE" />}
            hasIcon={true}
        >
            <BannerPoints points={points} />
        </CloseableBanner>
    );
};
