import { ReactNode } from 'react';

import styled from 'styled-components';

import { Route } from '@suite-common/suite-types';
import { Row } from '@trezor/components';
import { spacings, spacingsPx, zIndices } from '@trezor/theme';

import { TradeActions } from 'src/components/suite/layouts/SuiteLayout/PageHeader/TradeActions';
import { HEADER_HEIGHT } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';
import { selectIsAccountTabPage, selectRouteName } from 'src/reducers/suite/routerReducer';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { HeaderActions } from './HeaderActions';
import { HeaderDropdown } from './HeaderDropdown';
import { PageName } from './PageNames/PageName';

const Container = styled.div`
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: ${HEADER_HEIGHT};
    min-height: ${HEADER_HEIGHT};
    padding: ${spacingsPx.xs} ${spacingsPx.md};
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation1};
    overflow: auto hidden;
    z-index: ${zIndices.pageHeader};
`;

// TODO: perhaps this could be a part of some router config / useLayoutHook / somthing else?
interface PageHeaderProps {
    backRoute?: Route['name'];
    children?: ReactNode;
}

export const PageHeader = ({ backRoute, children }: PageHeaderProps) => {
    const selectedAccount = useSelector(selectSelectedAccount);
    // TODO subpages + tabs could be in some router config? this approach feels a bit fragile
    const isAccountTabPage = useSelector(selectIsAccountTabPage);
    const routeName = useSelector(selectRouteName);

    // handle moment when children are not rendered yet in the Trade section
    const isTradeSection = routeName?.includes('wallet-trading');

    return isTradeSection || children ? (
        <Container>{children ?? null}</Container>
    ) : (
        <Container>
            <PageName backRoute={backRoute} />

            {routeName === 'suite-index' && (
                <Row gap={spacings.xxs}>
                    <HeaderDropdown />
                    <TradeActions />
                </Row>
            )}
            {!!selectedAccount && isAccountTabPage && <HeaderActions />}
        </Container>
    );
};
