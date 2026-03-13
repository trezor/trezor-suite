import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';

import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useSelector } from 'src/hooks/suite/useSelector';

import { BannerPoints } from './BannerPoints';
import { CloseableBanner } from './CloseableBanner';

export const StellarLimitedHistoryBanner = () => {
    const dispatch = useDispatch();
    const { stellarLimitedHistoryBannerClosed } = useSelector(selectFlags);

    if (stellarLimitedHistoryBannerClosed) {
        return null;
    }

    const handleClose = () => {
        dispatch(setFlag({ key: 'stellarLimitedHistoryBannerClosed', value: true }));
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
            intent="info"
            title={<Translation id="TR_STELLAR_LIMIT_HISTORY_TITLE" />}
            hasIcon={true}
        >
            <BannerPoints points={points} />
        </CloseableBanner>
    );
};
