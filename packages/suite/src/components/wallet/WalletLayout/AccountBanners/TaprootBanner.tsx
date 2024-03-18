import { Translation } from 'src/components/suite';
import { CloseableBanner } from './CloseableBanner';
import { useSelector } from 'src/hooks/suite/useSelector';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { setFlag } from 'src/actions/suite/suiteActions';
import { getBip43Type } from '@suite-common/wallet-utils';
import { Account } from 'src/types/wallet';
import { BannerPoints } from './BannerPoints';
import styled from 'styled-components';
import { selectSuiteFlags } from '../../../../reducers/suite/suiteReducer';

interface TaprootBannerProps {
    account?: Account;
}

const Dark = styled.span`
    color: ${({ theme }) => theme.textDefault};
`;

export const TaprootBanner = ({ account }: TaprootBannerProps) => {
    const { taprootBannerClosed } = useSelector(selectSuiteFlags);
    const dispatch = useDispatch();

    const isVisible =
        !taprootBannerClosed && account && account.empty && getBip43Type(account.path) === 'bip86';

    if (!isVisible) {
        return null;
    }

    const closeTaprootBanner = () => dispatch(setFlag('taprootBannerClosed', true));

    return (
        <CloseableBanner
            onClose={closeTaprootBanner}
            variant="primary"
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
