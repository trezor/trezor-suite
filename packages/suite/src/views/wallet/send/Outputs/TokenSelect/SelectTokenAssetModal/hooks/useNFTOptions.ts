import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectIsNftSectionEnabled } from '@suite/settings';
import {
    type TokenDefinitionsRootState,
    selectNftDefinitions,
} from '@suite-common/token-definitions';
import { type Account } from '@suite-common/wallet-types';

import { buildNFTOptions } from '../nftOptions';

export const useNFTOptions = (account: Account) => {
    const isNftSectionEnabled = useSelector(selectIsNftSectionEnabled);
    const nftDefinitions = useSelector((state: TokenDefinitionsRootState) =>
        selectNftDefinitions(state, account.symbol),
    );

    return useMemo(
        () => buildNFTOptions({ account, nftDefinitions, isNftSectionEnabled }),
        [account, nftDefinitions, isNftSectionEnabled],
    );
};
