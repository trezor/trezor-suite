// @flow

// TxAck replacement
// TxAck needs more exact types
// PrevInput and TxInputType requires exact responses in TxAckResponse
// main difference: PrevInput should not contain address_n (unexpected field by protobuf)

// @overhead-start this will be removed during compilation
type TxInputType = any;
type PrevInput = any;
type TxOutputBinType = any;
type TxOutputType = any;
// @overhead-end

export type TxAckResponse =
    | {|
          inputs: Array<TxInputType | PrevInput>,
      |}
    | {|
          bin_outputs: TxOutputBinType[],
      |}
    | {|
          outputs: TxOutputType[],
      |}
    | {|
          extra_data: string,
      |}
    | {|
          version?: number,
          lock_time?: number,
          inputs_cnt: number,
          outputs_cnt: number,
          extra_data?: string,
          extra_data_len?: number,
          timestamp?: number,
          version_group_id?: number,
          expiry?: number,
          branch_id?: number,
      |};

export type TxAck = {
    tx: TxAckResponse,
};
// - TxAck replacement end
