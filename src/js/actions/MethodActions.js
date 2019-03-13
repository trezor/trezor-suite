/* @flow */

import { push } from 'connected-react-router';
import TrezorConnect from 'trezor-connect';
import { loadDocs } from './DocsActions';

export const TAB_CHANGE: string = 'method_tab_change';
export const FIELD_CHANGE: string = 'method_field_change';
export const ADD_BATCH: string = 'method_add_batch';
export const REMOVE_BATCH: string = 'method_remove_batch';
export const RESPONSE: string = 'method_response';

export const onTabChange = (tab) => (dispatch, getState) => {
    dispatch({
        type: TAB_CHANGE,
        tab
    });

    if (tab !== 'docs') return;
    dispatch(loadDocs());
}

export const onFieldChange = (field, value) => {
    return {
        type: FIELD_CHANGE,
        field,
        value
    }
}

export const onBatchAdd = (field, item) => {
    return {
        type: ADD_BATCH,
        field,
        item
    }
}

export const onBatchRemove = (field, batch) => {
    return {
        type: REMOVE_BATCH,
        field,
        batch,
    }
}

export const onSubmit = () => async (dispatch, getState) => {
    const { method } = getState();
    const connectMethod = TrezorConnect[method.name];
    if (typeof connectMethod !== 'function') {
        dispatch(onResponse({
            error: `Method "${connectMethod}" not found in TrezorConnect`
        }));
        return;
    }

    const response = await connectMethod({
      ...method.params,
    });

    // const connectParams = {};
    // try {
    //     Object.keys(method.params).forEach(key => {
    //         const field = method.fields.find(f => f.name === key);
    //         if (field.type === 'json') {
    //             connectParams[key] = eval(field.value);
    //         } else {
    //             connectParams[key] = field.value;
    //         }
    //     });
    // } catch (error) {
    //     console.error(error);
    //     dispatch(onResponse({
    //         error: error.toString(),
    //         message: 'Parse params error. Probably caused by invalid json object.'
    //     }));
    //     return;
    // }

    // const response = await connectMethod({
    //   ...method.params,
    //   version: 4,
    //   overwintered: true,
    //   versionGroupId: 0x892f2085
    // });

   

    // const response = await TrezorConnect.signTransaction({
    //   inputs: [
    //     {
    //         address_n: [44 | 0x80000000, 0 | 0x80000000, 2 | 0x80000000, 1, 0],
    //         prev_index: 0,
    //         prev_hash: 'b035d89d4543ce5713c553d69431698116a822c57c03ddacf3f04b763d1999ac'
    //     }
    //   ],
    //   outputs: [
    //       {
    //           address_n: [44 | 0x80000000, 0 | 0x80000000, 2 | 0x80000000, 1, 1],
    //           amount: '3181747',
    //           script_type: 'PAYTOADDRESS'
    //       }, {
    //           address: '18WL2iZKmpDYWk1oFavJapdLALxwSjcSk2',
    //           amount: '200000',
    //           script_type: 'PAYTOADDRESS'
    //       }
    //   ],
    //   refTxs: [
    //     {
    //       hash: "b035d89d4543ce5713c553d69431698116a822c57c03ddacf3f04b763d1999ac",
    //       inputs: [
    //         {
    //           prev_hash: "448946a44f1ef514601ccf9b22cc3e638c69ea3900b67b87517ea673eb0293dc",
    //           prev_index: 0,
    //           script_sig: "47304402202872cb8459eed053dcec0f353c7e293611fe77615862bfadb4d35a5d8807a4cf022015057aa0aaf72ab342b5f8939f86f193ad87b539931911a72e77148a1233e022012103f66bbe3c721f119bb4b8a1e6c1832b98f2cf625d9f59242008411dd92aab8d94",
    //           sequence: 4294967295,
    //         }
    //       ],
    //       bin_outputs: [
    //         {
    //           amount: 3431747,
    //           script_pubkey: "76a91441352a84436847a7b660d5e76518f6ebb718dedc88ac",
    //         },
    //         {
    //           amount: 10000,
    //           script_pubkey: "76a9141403b451c79d34e6a7f6e36806683308085467ac88ac",
    //         }
    //       ],
    //       lock_time: 0,
    //       version: 1,
    //     }
    //   ],
    //   coin: "btc",
    //   push: true
    // })

    /*
    const response = await TrezorConnect.signTransaction({
        coin: "test",
        inputs: [
          {
            address_n: [
              2147483693,
              0,
              0,
              0
            ],
            prev_hash: "b42c658796927fb4d75aa7c5c404be78718c814b4fcd9a22a077a8c876a7240f",
            prev_index: 0,
            script_sig: "00483045022100f96ce611c1e06e540acadc83d8b74c4e8e38aaedea6c1bae5f6e25ce07d83a2f02201960ad9b78c9f511d75444794a9b975391913f6526cd095de1d7f4edd7ee050c0101ff4cad524c53ff043587cf0000000000000000006109a29836a5adfc1e03c0ec9f9e606109d9392670d8bcabdacdfa7ce9e48ed5028cb7707b6a0b73a27946c044f3d2ea9356e9b163986c07c22e299e93e16d45aa000000004c53ff043587cf02b114b63000000000d499aa3ddd978271b43979d84a38656b296177c08e1babfb4fdc15f59c4bfec4023b7830d36f197844b7203a9fab93afde0d2eb45aa98352e394c750280ec97e950000000052ae",
            sequence: 4294967293,
            script_type: "SPENDMULTISIG",
            multisig: {
              m: 2,
              pubkeys: [
                {
                  node: "tpubD6NzVbkrYhZ4XJeyzHmeBT7k3caJqz8JJgnFUCPmDv287qWcVm4Sq7av35EpbF5hjHMqwRykp3PYhjnrvqwfmvEzoafLJkjZdw8sP8kRCr3",
                  address_n: [
                    0,
                    0
                  ]
                },
                {
                  node: "tpubDBSkiQYQ3thN8VgYvtYHBUJR7KUJZvDNzdJXJ45thgnnakd8hUALaBCkxSqoxyL4jxSbdiS2iobo2QzPYGmsJ6VJpcawSXM9XrrgDyzWTpr",
                  address_n: [
                    0,
                    0
                  ]
                }
              ],
              signatures: [
                "",
                ""
              ]
            },
            amount: "11099696"
          }
        ],
        outputs: [
          {
            address: "n1iozfb1SY9tDj5vwaLtKJWZ6EgZrYpZej",
            amount: "11089696",
            script_type: "PAYTOADDRESS"
          }
        ],
        refTxs: [{
          hash: "b42c658796927fb4d75aa7c5c404be78718c814b4fcd9a22a077a8c876a7240f",
          inputs: [{
            prev_hash: "88df1f381216aa2e093b03a791df12bb3c6ea06233ac4ee338de52710eb8499f",
            prev_index: 1,
            script_sig: "483045022100883960396d789ce74e3ef0e3691d1831c26bac7ffa94b8d5b91a7803fca0864502205b6514d1cde24ca81bbd7bb260885db9bb5d8d6a60b1a4b27b6d440d35b4b2430121023f92d5867a71aacb405796a79ea18a9b2cbabac52fa5bf65d841421002c461ae",
            sequence: 4294967293,
          }],
          bin_outputs: [{
            amount: 11099696,
            script_pubkey: "a9148c7ba68d613b7bd935f5a0ca89df54823f169eef87",
          }],
          lock_time: 1482215,
          version: 2,
          // extra_data: null,
          // version_group_id: null,
          expiry: 0,
        }],
        locktime: 1484660,
        version: 2,
      });
    */

    dispatch(onResponse(response));

}

export const onResponse = (response) => {
    return {
        type: RESPONSE,
        response
    }
}


export const onVerify = (url: string) => async (dispatch, getState) => {
    const { method } = getState();
    const verifyMethodValues = {
        address: method.response.payload.address,
        signature: method.response.payload.signature,
        coin: method.params.coin,
        message: method.params.message,
    }

    // ethereum extra field
    if (method.params.hasOwnProperty('hex')) {
      verifyMethodValues.hex = method.params.hex;
    }

    // lisk extra field
    if (method.response.payload.publicKey) {
      verifyMethodValues.publicKey = method.response.payload.publicKey;
    }

    await dispatch(push(url));

    const verifyMethod = getState().method;
    verifyMethod.fields.forEach(async (f) => {
        if (verifyMethodValues[f.name]) {
          await dispatch(onFieldChange(f, verifyMethodValues[f.name]));
        }
    });
}

