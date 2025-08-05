import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { selectActiveBannerMessages } from '@suite-common/message-system';

export const useIsMessageSystemBannerVisible = () =>
    A.isNotEmpty(useSelector(selectActiveBannerMessages));
