import { PropsWithChildren } from 'react';
import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { CoinmarketLayoutNavigation } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/CoinmarketLayoutNavigation/CoinmarketLayoutNavigation';
import { useSelector } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';

const CoinmarketWrapper = styled.div`
    padding: 0 ${spacingsPx.lg};

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        padding: 0;
    }
`;

const CoinmarketFormWrapper = styled.div`
    margin-top: ${spacingsPx.xl};
`;

interface CoinmarketLayoutProps extends PropsWithChildren {}

export const CoinmarketLayout = ({ children }: CoinmarketLayoutProps) => {
    const routeName = useSelector(selectRouteName);

    return (
        <CoinmarketWrapper>
            {!routeName?.includes(`wallet-coinmarket-exchange`) && <CoinmarketLayoutNavigation />}
            <CoinmarketFormWrapper>{children}</CoinmarketFormWrapper>
        </CoinmarketWrapper>
    );
};
