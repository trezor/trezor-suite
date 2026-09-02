import { useCallback } from 'react';

import { useAnchor } from '@suite/router';

import { getYieldOpportunityAnchor } from 'src/components/earn/utils/getYieldOpportunityAnchor';

import type { YieldAccountOpportunity } from '../types';

export function useYieldAccountOpportunityAnchor(opportunity: YieldAccountOpportunity) {
    // Anchored from the yield badges on the account screens — scrolls to and highlights
    // this row only.
    const rowAnchor =
        getYieldOpportunityAnchor({
            account: opportunity.account,
            vaultId: opportunity.vault.id,
        }) ?? '';
    const { anchorRef, shouldHighlight } = useAnchor<HTMLElement>(rowAnchor);
    // The row is a table row in one layout and a card in the other, so the anchor element
    // is attached by callback instead of a single typed ref.
    const setAnchorElement = useCallback(
        (element: HTMLElement | null) => {
            anchorRef.current = element;
        },
        [anchorRef],
    );

    return {
        setAnchorElement,
        shouldHighlight,
    };
}
