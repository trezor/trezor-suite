import React from 'react';

interface ApiPlaygroundProps {
    method: string;
}

export const ApiPlayground = ({ method }: ApiPlaygroundProps) => {
    return (
        <div className="bg-white border border-neutral-200 fixed d-block bottom-2 left-2 right-2 md:left-64 p-4 z-50 rounded-2xl dark:bg-neutral-900 shadow-xl">
            <h2 className="text-2xl font-bold">{method} API</h2>
            <p>This is the API playground... (WIP)</p>
            <button className="btn bg-green-700 text-white px-8 py-2 font-bold rounded-2xl mt-2">
                Send
            </button>
        </div>
    );
};
