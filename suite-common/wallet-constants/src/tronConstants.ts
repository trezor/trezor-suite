export type TronTxContractType =
    | 'AccountCreateContract' // Creates a new basic TRON account
    | 'TransferContract' // Executes basic TRX transfer operations
    | 'TransferAssetContract' // Executes TRC-10 token transfers
    | 'VoteWitnessContract' // Votes for Super Representatives (SRs)
    | 'WitnessCreateContract' // Registers to become an SR candidate
    | 'WitnessUpdateContract' // Updates the public information of an SR
    | 'AssetIssueContract' // Creates and configures a TRC-10-standard token
    | 'ParticipateAssetIssueContract' // Participates in TRC-10 token crowdsales
    | 'AccountUpdateContract' // Updates basic account information
    | 'FreezeBalanceContract' // Stakes TRX to obtain Bandwidth/Energy resources (Deprecated, please use FreezeBalanceV2Contract)
    | 'UnfreezeBalanceContract' // Unfreezes staked TRX in Stake1.0
    | 'WithdrawBalanceContract' // Allows SRs to claim block rewards or users to claim voting rewards
    | 'UnfreezeAssetContract' // Unfreezes frozen TRC-10 token (requires issuer authorization)
    | 'UpdateAssetContract' // Modifies basic parameters of an issued TRC-10 token
    | 'ProposalCreateContract' // Creates a new proposal to modify network parameters
    | 'ProposalApproveContract' // SRs vote on proposals
    | 'ProposalDeleteContract' // Deletes an existing network parameter modification proposal
    | 'SetAccountIdContract' // Sets a custom unique identifier (Account ID) for an account
    | 'CustomContract' // Executes legacy custom contract logic (deprecated)
    | 'CreateSmartContract' // Deploys a smart contract
    | 'TriggerSmartContract' // Interacts with a smart contract
    | 'GetContract' // Queries detailed information about a smart contract
    | 'UpdateSettingContract' // Modifies the user resource consumption ratio of a smart contract (the resource allocation ratio between developers and users)
    | 'UpdateEnergyLimitContract' // Modifies the Energy consumption limit of a smart contract
    | 'AccountPermissionUpdateContract' // Manages the multi-signature permission configuration of an account
    | 'ClearABIContract' // Clears the ABI definition of a smart contract
    | 'UpdateBrokerageContract' // Adjusts the commission ratio for SRs
    | 'DelegateResourceContract' // Implements resource delegation operations (such as Bandwidth and Energy)
    | 'UnDelegateResourceContract' // Implements resource undelegation operations
    | 'FreezeBalanceV2Contract' // Used to stake TRX to obtain Bandwidth or Energy resources in Stake 2.0 of the TRON network (the original 1.0 staking method has been deprecated)
    | 'UnfreezeBalanceV2Contract' // Used to unfreeze staked TRX and return the Bandwidth/Energy resources (used in conjunction with FreezeBalanceV2Contract)
    | 'WithdrawExpireUnfreezeContract' // Used to withdraw TRX funds that have passed the unstaking waiting period (must be executed after initiating UnfreezeBalanceV2Contract)
    | 'CancelAllUnfreezeV2Contract'; // Used to cancel all uncompleted unstaking operations (revokes initiated unstaking requests within the unstaking waiting period)
