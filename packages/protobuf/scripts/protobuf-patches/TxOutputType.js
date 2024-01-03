// TxOutputType replacement
// TxOutputType needs more exact types
// differences: external output (no address_n), opreturn output (no address_n, no address)

export type ChangeOutputScriptType = Exclude<OutputScriptType, 'PAYTOOPRETURN'>;

export type TxOutputType =
    | {
          address: string,
          address_n?: typeof undefined,
          script_type: 'PAYTOADDRESS',
          amount: UintType,
          multisig?: MultisigRedeemScriptType,
          orig_hash?: string,
          orig_index?: number,
          payment_req_index?: number,
      }
    | {
          address?: typeof undefined,
          address_n: number[],
          script_type?: ChangeOutputScriptType,
          amount: UintType,
          multisig?: MultisigRedeemScriptType,
          orig_hash?: string,
          orig_index?: number,
          payment_req_index?: number,
      }
    // NOTE: the type was loosened for compatibility (issue #10474)
    // It is not originally intended to use address instead of address_n with change output
    | {
        address: string,
        address_n?: typeof undefined,
        script_type?: ChangeOutputScriptType,
        amount: UintType,
        multisig?: MultisigRedeemScriptType,
        orig_hash?: string,
        orig_index?: number,
        payment_req_index?: number,
    }
    | {
          address?: typeof undefined,
          address_n?: typeof undefined,
          amount: '0' | 0,
          op_return_data: string,
          script_type: 'PAYTOOPRETURN',
          orig_hash?: string,
          orig_index?: number,
          payment_req_index?: number,
      };

export type TxOutput = TxOutputType;

// - TxOutputType replacement end
