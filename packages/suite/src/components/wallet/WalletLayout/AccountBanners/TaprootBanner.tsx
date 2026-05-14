import styled from 'styled-components';

import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { getBip43Type } from '@suite-common/wallet-utils';

import { useDispatch } from 'src/hooks/suite/useDispatch';
import { useSelector } from 'src/hooks/suite/useSelector';
import { type Account } from 'src/types/wallet';

import { BannerPoints } from './BannerPoints';
import { CloseableBanner } from './CloseableBanner';

interface TaprootBannerProps {
    account?: Account;
}

const Dark = styled.span`
    color: ${({ theme }) => theme.contentPrimary};
`;

export const TaprootBanner = ({ account }: TaprootBannerProps) => {
    const { taprootBannerClosed } = useSelector(selectFlags);
    const dispatch = useDispatch();

    const isVisible =
        !taprootBannerClosed && account && account.empty && getBip43Type(account.path) === 'bip86';

    if (!isVisible) {
        return null;
    }

    const closeTaprootBanner = () => dispatch(setFlag({ key: 'taprootBannerClosed', value: true }));

    return (
        <CloseableBanner
            onClose={closeTaprootBanner}
            intent="info"
            title={<Translation id="TR_TAPROOT_BANNER_TITLE" />}
        >
            <BannerPoints
                points={[
                    <Translation
                        id="TR_TAPROOT_BANNER_POINT_1"
                        key="TR_TAPROOT_BANNER_POINT_1"
                        values={{
                            strong: chunks => <Dark>{chunks}</Dark>,
                        }}
                    />,
                    <Translation
                        id="TR_TAPROOT_BANNER_POINT_2"
                        key="TR_TAPROOT_BANNER_POINT_2"
                        values={{
                            strong: chunks => <Dark>{chunks}</Dark>,
                        }}
                    />,
                ]}
            />
        </CloseableBanner>
    );
};
