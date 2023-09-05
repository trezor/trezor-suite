import { ReactNode } from 'react';

import { useAtomValue } from 'jotai';

import { AlertSheet } from './AlertSheet';
import { alertAtom } from '../alertsAtoms';

type NotificationRendererProps = {
    children: ReactNode;
};

export const AlertRenderer = ({ children }: NotificationRendererProps) => {
    const alert = useAtomValue(alertAtom);

    return (
        <>
            {children}
            {alert && <AlertSheet alert={alert} />}
        </>
    );
};
