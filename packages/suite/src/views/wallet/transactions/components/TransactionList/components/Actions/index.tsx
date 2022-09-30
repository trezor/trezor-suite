import React from 'react';
import styled from 'styled-components';
import { SearchAction, SearchProps } from './components/SearchAction';
import { ExportAction, ExportActionProps } from './components/ExportAction';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

interface Props extends SearchProps, ExportActionProps {}

const Actions = ({ account, search, setSearch, setSelectedPage }: Props) => (
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

export default Actions;
