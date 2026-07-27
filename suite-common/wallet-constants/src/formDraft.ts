export const FormDraftWithSendPrefixKeyValues = [
    'trading-buy',
    'trading-sell',
    'trading-exchange',
    'stake',
    'unstake',
    'claim',
    'send',
    'stellar-token',
] as const;

// 'send' is excluded because it currently uses own drafts in state.wallet.send.drafts indexed by accountKey and tokenContract.
// Instead, trading and staking use drafts in state.wallet.formDrafts indexed by prefix and accountKey (optionally).
export const FormDraftPrefixKeyValues = FormDraftWithSendPrefixKeyValues.filter(
    key => key !== 'send',
);
