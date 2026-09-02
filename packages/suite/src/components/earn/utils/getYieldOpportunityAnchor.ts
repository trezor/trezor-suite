import { type AnchorType, getEarnYieldRowAnchor } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';

type GetYieldOpportunityAnchorProps = {
    account?: Account;
    vaultId: string;
};

/** Anchor of the Earn yield dashboard row holding the given vault for the given account. */
export const getYieldOpportunityAnchor = ({
    account,
    vaultId,
}: GetYieldOpportunityAnchorProps): AnchorType | undefined =>
    account &&
    getEarnYieldRowAnchor({
        symbol: account.symbol,
        accountIndex: account.index,
        accountType: account.accountType,
        vaultId,
    });
