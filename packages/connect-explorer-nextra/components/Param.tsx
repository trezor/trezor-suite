import React from 'react';
import Markdown from 'react-markdown';

interface ParamProps {
    name: string;
    type: string | React.ReactNode;
    required?: boolean;
    description?: string;
    children?: React.ReactNode;
}

export const Param = (props: ParamProps) => {
    return (
        <>
            <div className="mt-2 rounded-2xl bg-gradient-to-b from-neutral-100 to-transparent">
                <div className="flex flex-row px-4 py-2 gap-4 justify-center items-center">
                    <h3 className="font-bold font-mono text-sm">{props.name}</h3>
                    <div className="flex-1 text-sm">
                        {typeof props.type === 'string' ? (
                            <Markdown>{props.type}</Markdown>
                        ) : (
                            props.type
                        )}
                    </div>
                    {props.required ? (
                        <div className="bg-green-200 text-green-700 py-1 px-3 d-inline-block rounded-2xl font-bold">
                            required
                        </div>
                    ) : (
                        <div className="bg-blue-200 text-blue-600 py-1 px-3 d-inline-block rounded-2xl font-bold">
                            optional
                        </div>
                    )}
                </div>
                {props.description && (
                    <div className="px-8 py-2 bg-white rounded-lg">
                        <Markdown>{props.description}</Markdown>
                    </div>
                )}
                {props.children && (
                    <div className="mx-4 px-4 py-2 bg-white rounded-lg">{props.children}</div>
                )}
            </div>
        </>
    );
};
