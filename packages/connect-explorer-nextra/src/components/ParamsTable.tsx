import React from 'react';

import { Kind, Optional, TIntersect, TObject, TSchema } from '@sinclair/typebox';

import { Param } from './Param';
import { getTypeName } from '../utils/getTypeName';
import { descriptionDictionary } from '../constants/descriptions';

interface SingleParamProps {
    name: string;
    value: TSchema;
    schema?: TSchema;
    topLevelSchema: TObject | TIntersect | TSchema;
    isTopLevel?: boolean;
}
const SingleParam = ({ name, value, schema, topLevelSchema, isTopLevel }: SingleParamProps) => {
    // Show descendants for complex objects
    const complexObjects = ['Object', 'Union', 'Intersect'];
    let hasDescendants = complexObjects.includes(value[Kind]);
    let typeLink: string | undefined;
    if (value[Kind] === 'Union') {
        // Show descendants for unions only if they contain complex objects
        hasDescendants = value.anyOf.some((v: TSchema) => complexObjects.includes(v[Kind]));
    } else if (value[Kind] === 'Array') {
        // Show descendants for arrays only if they contain complex objects
        hasDescendants = complexObjects.includes(value.items[Kind]);
    } else if (
        value[Kind] === 'Object' &&
        topLevelSchema?.[Kind] === 'Object' &&
        !isTopLevel &&
        value.$id &&
        Object.entries(topLevelSchema.properties).some(([_, val]: any) => val.$id === value.$id)
    ) {
        // If the object is a reference to the top level object, don't show descendants
        hasDescendants = false;
        typeLink = `#${value.$id}`;
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

    let description;
    if (value.description) {
        description = value.description;
    } else if (isTopLevel && topLevelSchema?.$id && name) {
        description = descriptionDictionary[topLevelSchema?.$id + '.' + name];
    }
    if (!description && name) {
        description = descriptionDictionary[name];
    }

    return (
        <>
            <Param
                id={isTopLevel ? value.$id : undefined}
                key={name}
                name={name}
                type={typeName}
                typeLink={typeLink}
                required={isRequired}
                description={description}
            />
            {hasDescendants && (
                <div style={{ marginLeft: 30 }}>
                    {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
                    <ParamsTable schema={value} topLevelSchema={topLevelSchema} />
                </div>
            )}
        </>
    );
};

type ParamsTableProps = {
    schema: TObject | TIntersect | TSchema;
    topLevelSchema?: TObject | TIntersect | TSchema;
};
export const ParamsTable = ({ schema, topLevelSchema }: ParamsTableProps) => {
    const topLevelSchemaCurrent = topLevelSchema ?? schema;
    if (schema[Kind] === 'Union') {
        return schema.anyOf?.map((param: TSchema, i: number) => (
            <>
                {i > 0 && <h3>or</h3>}
                <ParamsTable key={i} schema={param} topLevelSchema={topLevelSchemaCurrent} />
            </>
        ));
    } else if (schema[Kind] === 'Intersect') {
        return schema.allOf?.map((param: TSchema, i: number) => (
            <ParamsTable key={i} schema={param} topLevelSchema={topLevelSchemaCurrent} />
        ));
    } else if (schema[Kind] === 'Object') {
        return Object.entries(schema.properties)?.map(([name, value]: [string, any]) => (
            <SingleParam
                name={name}
                value={value}
                schema={schema}
                key={name}
                topLevelSchema={topLevelSchemaCurrent}
                isTopLevel={topLevelSchema === undefined}
            />
        ));
    } else if (schema[Kind] === 'Array') {
        return <SingleParam name="" value={schema.items} topLevelSchema={topLevelSchemaCurrent} />;
    } else {
        return <SingleParam name="" value={schema} topLevelSchema={topLevelSchemaCurrent} />;
    }
};
