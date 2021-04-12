import React from 'react';
import styled from 'styled-components';
import SearchAction, { Props as SearchProps } from './components/SearchAction';
import ExportAction, { Props as ExportProps } from './components/ExportAction';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

interface Props extends SearchProps, ExportProps {}

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
