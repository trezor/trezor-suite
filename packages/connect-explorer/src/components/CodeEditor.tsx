import { useMemo, useState } from 'react';

import { json5Schema } from 'codemirror-json-schema/json5';
import CodeMirror from '@uiw/react-codemirror';
import { useTheme } from 'styled-components';
import { TSchema } from '@sinclair/typebox';

interface CodeEditorProps {
    code: string;
    codeChange: (code: string) => void;
    schema?: TSchema;
}
export const CodeEditor = ({ code, codeChange, schema }: CodeEditorProps) => {
    const theme = useTheme();

    const [codeKey, setCodeKey] = useState(0);
    const extensions = useMemo(() => {
        setCodeKey(prev => prev + 1);

        const patchedSchema = schema ? { ...schema } : { properties: {} };
        const inner = (s: any) => {
            // Patch Uint type which is not standard JSON Schema
            if (s.type === 'Uint') {
                s.type = ['number', 'string'];
            }
            if (s.properties) {
                Object.entries(s.properties).forEach(([_, v]) => {
                    inner(v);
                });
            }
        };
        inner(patchedSchema);

        return [json5Schema(patchedSchema)];
    }, [schema]);

    return (
        <CodeMirror
            key={codeKey}
            value={code}
            extensions={extensions}
            theme={theme.legacy.THEME}
            onChange={codeChange}
        />
    );
};
