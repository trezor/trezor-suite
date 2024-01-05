import { CardanoNativeScriptType } from '@trezor/protobuf/lib/messages-schema';

import { cardanoDerivationType, cardanoNativeScriptHashDisplayFormat } from './common';

const name = 'cardanoGetNativeScriptHash';
const docs = 'methods/cardanoGetNativeScriptHash.md';

export default [
    {
        url: '/method/cardanoGetNativeScriptHash',
        name,
        docs,
        submitButton: 'Submit',

        fields: [
            {
                name: 'script',
                type: 'json',
                value: {
                    type: CardanoNativeScriptType.PUB_KEY,
                    keyHash: 'c4b9265645fde9536c0795adbcc5291767a0c61fd62448341d7e0386',
                },
            },
            cardanoNativeScriptHashDisplayFormat,
            cardanoDerivationType,
        ],
    },
];
