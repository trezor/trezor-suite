import { useEffect } from 'react';
import { useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';

const Redirect = () => {
    const { goto } = useActions({ goto: routerActions.goto });

    useEffect(() => {
        // trezor-suite://redirect
        // @ts-ignore global.ipcRenderer is declared in @desktop/preloader.js
        const { ipcRenderer } = global;
        if (ipcRenderer) {
            ipcRenderer.on('coinmarket-redirect', () => {
                goto('wallet-coinmarket-buy-detail');
            });
        }
    });

    return null;
};

export default Redirect;
