import React from 'react';

import SearchAction, { Props as SearchProps } from './components/SearchAction';
import ExportAction, { Props as ExportProps } from './components/ExportAction';

interface Props extends SearchProps, ExportProps {}

const Actions = ({ account, search, setSearch, setSelectedPage }: Props) => {
    return (
        <>
            <SearchAction
                account={account}
                search={search}
                setSearch={setSearch}
                setSelectedPage={setSelectedPage}
            />
            <ExportAction account={account} />
        </>
    );
};

export default Actions;
