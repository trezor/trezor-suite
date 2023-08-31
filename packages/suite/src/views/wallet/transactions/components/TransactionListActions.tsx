import styled from 'styled-components';
import { SearchAction, SearchProps } from './SearchAction';
import { ExportAction, ExportActionProps } from './ExportAction';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

interface TransactionListActionsProps extends SearchProps, ExportActionProps {}

export const TransactionListActions = ({
    account,
    search,
    setSearch,
    setSelectedPage,
}: TransactionListActionsProps) => (
    <Wrapper>
        <SearchAction
            account={account}
            search={search}
            setSearch={setSearch}
            setSelectedPage={setSelectedPage}
        />
        <ExportAction account={account} />
    </Wrapper>
);
