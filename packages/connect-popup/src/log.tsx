import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { ObjectInspector } from 'react-inspector';

const MAX_ENTRIES = 1000;

const DownloadButton = ({ array, filename }: { array: any[]; filename: string }) => {
    const buttonStyle = {
        backgroundColor: '#01b757',
        color: '#ffffff',
        fontSize: '14px',
        padding: '12px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        width: '200px',
        margin: '10px 0',
    };

    const downloadArrayAsFile = () => {
        const data = JSON.stringify(array, null, 2);
        const blob = new Blob([data], { type: 'application/json' });

        // Temporary anchor element.
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);

        // Programmatically trigger a click event on the anchor element.
        a.click();

        // Remove the anchor element from the document body.
        document.body.removeChild(a);

        URL.revokeObjectURL(a.href);
    };

    return (
        <button
            data-test="@log-container/download-button"
            type="button"
            style={buttonStyle}
            onClick={downloadArrayAsFile}
        >
            Download Logs
        </button>
    );
};

const useLogWorker = (setLogs: React.Dispatch<React.SetStateAction<any[]>>) => {
    const logWorker = new SharedWorker('./workers/shared-logger-worker.js');
    useEffect(() => {
        logWorker.port.onmessage = function (event) {
            const { data } = event;
            switch (data.type) {
                case 'get-logs':
                    setLogs(data.payload);
                    break;
                case 'log-entry':
                    setLogs(prevLogs => {
                        if (prevLogs.length > MAX_ENTRIES) {
                            prevLogs.shift();
                        }
                        return [...prevLogs, data.payload];
                    });
                    break;
                default:
            }
        };

        logWorker.port.postMessage({ type: 'get-logs' });
        logWorker.port.postMessage({ type: 'subscribe' });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return logWorker;
};

const Inspector = () => {
    const [logs, setLogs] = useState<any[]>([]);
    useLogWorker(setLogs);

    return (
        <>
            {logs.length > 0 ? (
                <>
                    <DownloadButton array={logs} filename="trezor-connect-logs.json" />
                    <ObjectInspector expandLevel={2} data={logs} />
                </>
            ) : (
                <p>No logs yet.</p>
            )}
        </>
    );
};

const App = () => (
    <>
        <h1>TrezorConnect Logger</h1>
        <Inspector />
    </>
);

const renderUI = () => {
    const logReact = document.getElementById('log-react');
    const root = createRoot(logReact!);
    const Component = <App />;

    root.render(Component);
};

renderUI();
