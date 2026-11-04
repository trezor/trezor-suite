import { app } from 'electron';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

app.whenReady().then(() => {
    installExtension(REACT_DEVELOPER_TOOLS, { loadExtensionOptions: { allowFileAccess: true } })
        .then(() => {
            // NOTE: for some reasone, you first need to open dev tools and reload the app to see them
            console.warn('React Dev Tools loaded, open the dev tools and reload to enable them');
        })
        .catch(err => console.error('Failed to load React Dev Tools', err));
});
