import styled from 'styled-components';

import { Route } from '@suite-common/suite-types';
import { spacingsPx, zIndices } from '@trezor/theme';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { selectIsAccountTabPage } from 'src/reducers/suite/routerReducer';
import { HeaderActions } from './HeaderActions';
import { PageName } from './PageNames/PageName';

const HEADER_HEIGHT = 64;

const Container = styled.div`
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: ${HEADER_HEIGHT}px;
    min-height: ${HEADER_HEIGHT}px;
    padding: ${spacingsPx.xs} ${spacingsPx.md};
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation0};
    overflow: hidden;
    z-index: ${zIndices.pageHeader};
`;

// TODO: perhaps this could be a part of some router config / useLayoutHook / somthing else?
interface PageHeaderProps {
    backRoute?: Route['name'];
}

export const PageHeader = ({ backRoute }: PageHeaderProps) => {
    const selectedAccount = useSelector(selectSelectedAccount);
    // TODO subpages + tabs could be in some router config? this approach feels a bit fragile
    const isAccountTabPage = useSelector(selectIsAccountTabPage);

    return (
        <Container>
            <PageName backRoute={backRoute} />

            {!!selectedAccount && isAccountTabPage && <HeaderActions />}
        </Container>
    );
};
