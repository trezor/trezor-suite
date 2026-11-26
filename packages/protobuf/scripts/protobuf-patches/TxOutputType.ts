// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// TxOutputType replacement
// TxOutputType needs more exact types
// differences: external output (no address_n), opreturn output (no address_n, no address)
// contact fields: only on external outputs

export type ChangeOutputScriptType = Exclude<OutputScriptType, 'PAYTOOPRETURN'>;

export type TxOutputType =
    | {
          address: string;
          address_n?: never;
          script_type?: 'PAYTOADDRESS';
          amount: UintType;
          multisig?: MultisigRedeemScriptType;
          orig_hash?: string;
          orig_index?: number;
          payment_req_index?: number;
          contact_pubkey?: string;
          contact_signature?: string;
      }
    | {
          address?: never;
          address_n: number[];
          script_type?: ChangeOutputScriptType;
          amount: UintType;
          multisig?: MultisigRedeemScriptType;
          orig_hash?: string;
          orig_index?: number;
          payment_req_index?: number;
          contact_pubkey?: never;
          contact_signature?: never;
      }
    | {
          address?: never;
          address_n?: never;
          amount: '0' | 0;
          op_return_data: string;
          script_type: 'PAYTOOPRETURN';
          orig_hash?: string;
          orig_index?: number;
          payment_req_index?: number;
          contact_pubkey?: never;
          contact_signature?: never;
      };

export type TxOutput = TxOutputType;

// - TxOutputType replacement end
