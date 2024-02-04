import styled from 'styled-components';

import { spacingsPx, zIndices } from '@trezor/theme';
import { HeaderActions } from './HeaderActions';
import { PageName } from './PageName';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

const Container = styled.div`
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between;
    width: 100%;
    min-height: 64px;
    padding: ${spacingsPx.xs} ${spacingsPx.md};
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation0};
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
