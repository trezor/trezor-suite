// @flow
// TxOutputType replacement
// TxOutputType needs more exact types
// differences: external output (no address_n), opreturn output (no address_n, no address)

// @overhead-start
// will be removed during compilation
type UintType = any;
type MultisigRedeemScriptType = any;
type ChangeOutputScriptType = any;
// @overhead-end

// @typescript-variant: export type ChangeOutputScriptType = Exclude<OutputScriptType, 'PAYTOOPRETURN'>;
// @flowtype-variant: export type ChangeOutputScriptType = $Keys<$Diff<typeof Enum_OutputScriptType, { PAYTOOPRETURN: * }>>;

export type TxOutputType =
    | {|
          address: string,
          address_n?: typeof undefined,
          script_type: 'PAYTOADDRESS',
          amount: UintType,
          multisig?: MultisigRedeemScriptType,
          orig_hash?: string,
          orig_index?: number,
          payment_req_index?: number,
      |}
    | {|
          address?: typeof undefined,
          address_n: number[],
          script_type: ChangeOutputScriptType,
          amount: UintType,
          multisig?: MultisigRedeemScriptType,
          orig_hash?: string,
          orig_index?: number,
          payment_req_index?: number,
      |}
    | {|
          address?: typeof undefined,
          address_n?: typeof undefined,
          amount: '0',
          op_return_data: string,
          script_type: 'PAYTOOPRETURN',
          orig_hash?: string,
          orig_index?: number,
          payment_req_index?: number,
      |};

export type TxOutput = TxOutputType;

// - TxOutputType replacement end
