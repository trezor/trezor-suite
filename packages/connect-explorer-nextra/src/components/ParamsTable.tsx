import React from 'react';

import { Hint, Kind, Optional, TIntersect, TObject, TSchema } from '@sinclair/typebox';

import { Param } from './Param';

type ParamsTableProps = {
    schema: TObject | TIntersect | TSchema;
};

const descriptionDictionary: Record<string, string> = {
    path: 'Derivation path',
    showOnTrezor: 'Display the result on the Trezor device. Default is false',
    chunkify: 'Display the result in chunks for better readability. Default is false',
    suppressBackupWarning:
        'By default, this method will emit an event to show a warning if the wallet does not have a backup. This option suppresses the message.',
    coin: 'determines network definition specified in coins.json file. Coin shortcut, name or label can be used. If coin is not set API will try to get network definition from path.',
    crossChain:
        'Advanced feature. Use it only if you are know what you are doing. Allows to generate address between chains. For example Bitcoin path on Litecoin network will display cross chain address in Litecoin format.',
    unlockPath: 'the result of TrezorConnect.unlockPath method',
    ecdsaCurveName: 'ECDSA curve name to use',
    ignoreXpubMagic: 'ignore SLIP-0132 XPUB magic, use xpub/tpub prefix for all account types.',
    scriptType: 'used to distinguish between various address formats (non-segwit, segwit, etc.).',
};

const getTypeName = (value: TSchema, hasDescendants?: boolean) => {
    let typeName = value[Kind];
    if (value[Kind] === 'Array') {
        typeName = `Array<${getTypeName(value.items)}>`;
    } else if (value[Kind] === 'Literal') {
        if (typeof value.const === 'number') {
            typeName = value.const.toString();
        } else {
            typeName = JSON.stringify(value.const);
        }
    } else if (value[Kind] === 'Union' && !hasDescendants) {
        const itemsFiltered = value.anyOf?.filter((v, i) => {
            // Filter union number indexes - unnecessary to display
            if (v[Kind] === 'Literal' && (v.const === i || v.const === i.toString())) {
                return false;
            }

            return true;
        });
        if (itemsFiltered.length > 0) {
            typeName = itemsFiltered?.map(v => getTypeName(v)).join(' | ');
        } else if (value[Hint] === 'Enum') {
            // TODO handle enums - need to add $id in schema-utils
            typeName = 'Enum';
        }
    } else if (value[Kind] === 'Intersect' && !hasDescendants) {
        typeName = value.anyOf?.map(v => getTypeName(v)).join(' & ');
    } else if (value[Kind] === 'Object' && value.$id) {
        typeName = value.$id;
    }

    return typeName;
};

interface SingleParamProps {
    name: string;
    value: TSchema;
    schema?: TSchema;
}
const SingleParam = ({ name, value, schema }: SingleParamProps) => {
    // Show descendants for complex objects
    const complexObjects = ['Object', 'Union', 'Intersect'];
    let hasDescendants = complexObjects.includes(value[Kind]);
    if (value[Kind] === 'Union') {
        hasDescendants = value.anyOf.some(v => complexObjects.includes(v[Kind]));
    } else if (value[Kind] === 'Array') {
        hasDescendants = complexObjects.includes(value.items[Kind]);
    }
    // Get the type name
    const typeName = getTypeName(value, hasDescendants);

    // Required can also be undefined (for example union)
    let isRequired: boolean | undefined;
    if (schema?.required?.includes(name)) {
        isRequired = true;
    } else if (value[Optional] === 'Optional') {
        isRequired = false;
    }

    return (
        <>
            <Param
                key={name}
                name={name}
                type={typeName}
                required={isRequired}
                description={value.description ?? descriptionDictionary[name]}
            />
            {hasDescendants && (
                <div style={{ marginLeft: 30 }}>
                    {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
                    <ParamsTable schema={value} />
                </div>
            )}
        </>
    );
};

export const ParamsTable = ({ schema }: ParamsTableProps) => {
    if (schema[Kind] === 'Union') {
        return schema.anyOf?.map((param, i) => (
            <>
                {i > 0 && <h3>or</h3>}
                <ParamsTable key={i} schema={param} />
            </>
        ));
    } else if (schema[Kind] === 'Intersect') {
        return schema.allOf?.map((param, i) => <ParamsTable key={i} schema={param} />);
    } else if (schema[Kind] === 'Object') {
        return Object.entries(schema.properties)?.map(([name, value]: [string, any]) => (
            <SingleParam name={name} value={value} schema={schema} key={name} />
        ));
    } else if (schema[Kind] === 'Array') {
        return <SingleParam name="" value={schema.items} />;
    } else {
        return <SingleParam name="" value={schema} />;
    }
};
