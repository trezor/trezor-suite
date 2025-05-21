import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectSuiteFlags } from 'src/reducers/suite/suiteReducer';

import { BannerPoints } from './BannerPoints';
import { CloseableBanner } from './CloseableBanner';

export const StellarLimitedHistoryBanner = () => {
    const dispatch = useDispatch();
    const { stellarLimitedHistoryBannerClosed } = useSelector(selectSuiteFlags);

    if (stellarLimitedHistoryBannerClosed) {
        return null;
    }

    const handleClose = () => {
        dispatch(setFlag('stellarLimitedHistoryBannerClosed', true));
    };

    const points = [
        <Translation
            id="TR_STELLAR_LIMIT_HISTORY_DESCRIPTION"
            key="TR_STELLAR_LIMIT_HISTORY_DESCRIPTION"
        />,
    ];

    return (
        <CloseableBanner
            onClose={handleClose}
            variant="info"
            title={<Translation id="TR_STELLAR_LIMIT_HISTORY_TITLE" />}
            hasIcon={true}
        >
            <BannerPoints points={points} />
        </CloseableBanner>
    );
};
