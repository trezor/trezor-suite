// @flow
// TxInputType replacement
// TxInputType needs more exact types
// differences: external input (no address_n + required script_pubkey)

// @overhead-start
// will be removed during compilation
type UintType = any;
type MultisigRedeemScriptType = any;
type InternalInputScriptType = any;
type DecredStakingSpendType = any;
// @overhead-end

// @flowtype-variant: export type InternalInputScriptType = $Keys<$Diff<typeof Enum_InputScriptType, { EXTERNAL: * }>>;
// @typescript-variant: export type InternalInputScriptType = Exclude<InputScriptType, 'EXTERNAL'>;

type CommonTxInputType = {|
    prev_hash: string, // required: previous transaction hash (reversed)
    prev_index: number, // required: previous transaction index
    amount: UintType, // required
    sequence?: number,
    multisig?: MultisigRedeemScriptType,
    decred_tree?: number,
    orig_hash?: string, // RBF
    orig_index?: number, // RBF
    decred_staking_spend?: DecredStakingSpendType,
    script_pubkey?: string, // required if script_type=EXTERNAL
    script_sig?: string, // used by EXTERNAL, depending on script_pubkey
    witness?: string, // used by EXTERNAL, depending on script_pubkey
    ownership_proof?: string, // used by EXTERNAL, depending on script_pubkey
    commitment_data?: string, // used by EXTERNAL, depending on ownership_proof
|};

export type TxInputType =
    | {|
          ...CommonTxInputType,
          address_n: number[],
          script_type?: InternalInputScriptType,
      |}
    | {|
          ...CommonTxInputType,
          address_n?: typeof undefined,
          script_type: 'EXTERNAL',
          script_pubkey: string,
      |};

export type TxInput = TxInputType;

// TxInputType replacement end
