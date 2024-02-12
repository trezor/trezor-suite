import styled from 'styled-components';

import { spacingsPx, zIndices } from '@trezor/theme';
import { HeaderActions } from './HeaderActions';
import { PageName } from './PageNames/PageName';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

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

export const PageHeader = () => {
    const selectedAccount = useSelector(selectSelectedAccount);

    return (
        <Container>
            <PageName />

            {!!selectedAccount && <HeaderActions />}
        </Container>
    );
};
