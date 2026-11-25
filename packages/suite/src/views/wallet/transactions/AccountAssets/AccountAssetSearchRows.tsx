import { Translation } from '@suite/intl';
import {
    type AccountListSection,
    getAccountListSectionKey,
    isAccountListSectionMatchingSearch,
} from '@suite-common/assets';
import { selectNativeTokenName } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { useSelector } from '#src/hooks/suite/useSelector';

import { AccountAssetMessageRow } from './AccountAssetMessageRow';
import { AccountAssetSectionRow } from './AccountAssetSectionRow';

type AccountAssetSearchRowsProps = {
    networkSymbol: NetworkSymbol;
    /** What the table lists, held or at zero: a search shows every match, unfolded. */
    sections: readonly AccountListSection[];
    /** As `normalizeAssetSearchQuery` gives it. */
    query: string;
};

export const AccountAssetSearchRows = ({
    networkSymbol,
    sections,
    query,
}: AccountAssetSearchRowsProps) => {
    const nativeTokenName = useSelector(state => selectNativeTokenName(state, networkSymbol));
    const matches = sections.filter(section =>
        isAccountListSectionMatchingSearch({ section, query, nativeTokenName }),
    );

    if (matches.length === 0) {
        return (
            <AccountAssetMessageRow
                title={<Translation id="TR_NO_SEARCH_RESULTS" />}
                data-testid="@wallet/account-assets/no-search-results"
            />
        );
    }

    return matches.map(section => (
        <AccountAssetSectionRow key={getAccountListSectionKey(section)} section={section} />
    ));
};
