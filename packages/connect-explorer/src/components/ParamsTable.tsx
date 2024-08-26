import React from 'react';

import { Kind, OptionalKind, TIntersect, TObject, TSchema } from '@sinclair/typebox';

import { Param } from './Param';
import { getTypeName } from '../utils/getTypeName';
import { descriptionDictionary } from '../constants/descriptions';

interface SingleParamProps {
    name: string;
    value: TSchema;
    schema?: TSchema;
    topLevelSchema: TObject | TIntersect | TSchema;
    isTopLevel?: boolean;
    descriptions?: Record<string, string>;
}
const SingleParam = ({
    name,
    value,
    schema,
    topLevelSchema,
    isTopLevel,
    descriptions,
}: SingleParamProps) => {
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
    if (value[Kind] === 'Object' && Object.keys(value.properties).length === 0) {
        // No properties, don't show descendants or the object itself
        return null;
    }
    // Get the type name
    const typeName = getTypeName(value, hasDescendants);

    // Required can also be undefined (for example union)
    let isRequired: boolean | undefined;
    if (schema?.required?.includes(name)) {
        isRequired = true;
    } else if (value[OptionalKind] === 'Optional') {
        isRequired = false;
    }

    let description;
    if (descriptions?.[name]) {
        description = descriptions[name];
    } else if (value.description) {
        description = value.description;
    } else if (isTopLevel && topLevelSchema?.$id && name) {
        const key = topLevelSchema?.$id + '.' + name;
        if (descriptions?.[key]) description = descriptions[key];
        if (descriptionDictionary[key]) description = descriptionDictionary[key];
    }
    if (!description && name) {
        if (descriptionDictionary[name]) description = descriptionDictionary[name];
    }

    if (value[Kind] === 'Intersect') {
        return value.allOf?.map((param: TSchema, i: number) => (
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            <ParamsTable key={i} schema={param} topLevelSchema={topLevelSchema} />
        ));
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
    descriptions?: Record<string, string>;
};
export const ParamsTable = ({ schema, topLevelSchema, descriptions }: ParamsTableProps) => {
    const topLevelSchemaCurrent = topLevelSchema ?? schema;
    const common = { topLevelSchema: topLevelSchemaCurrent, descriptions };
    if (schema[Kind] === 'Union') {
        return schema.anyOf?.map((param: TSchema, i: number) => (
            <div key={i}>
                {i > 0 && <h3>or</h3>}
                <ParamsTable key={i} schema={param} {...common} />
            </div>
        ));
    } else if (schema[Kind] === 'Intersect') {
        return schema.allOf?.map((param: TSchema, i: number) => (
            <div key={i}>
                {i > 0 && <h3>and</h3>}
                <ParamsTable schema={param} {...common} />
            </div>
        ));
    } else if (schema[Kind] === 'Object') {
        return Object.entries(schema.properties)?.map(([name, value]: [string, any]) => (
            <SingleParam
                name={name}
                value={value}
                schema={schema}
                key={name}
                isTopLevel={topLevelSchema === undefined}
                {...common}
            />
        ));
    } else {
        return (
            <SingleParam
                name=""
                value={schema[Kind] === 'Array' ? schema.items : schema}
                {...common}
            />
        );
    }
};
