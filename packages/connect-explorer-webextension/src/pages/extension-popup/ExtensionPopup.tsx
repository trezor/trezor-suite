import React from 'react';

export const ExtensionPopup = () => {
    const openExplorerTab = () => {
        chrome.tabs.create({ url: 'connect-explorer.html' });
    };

    return (
        <div className="App">
            <p>Welcome to Trezor Connect Explorer extension!</p>

            <button type="button" onClick={openExplorerTab}>
                Open Connect Explorer
            </button>
        </div>
    );
};
