import {
    type ComponentType,
    type LazyExoticComponent,
    type ReactNode,
    Suspense,
    lazy,
    useEffect,
    useState,
} from 'react';

import { Flex } from '@trezor/components';
import { type Color } from '@trezor/theme';

import { type QrCodeInnerProps } from './QrCodeInner';

/**
 * qrcode.react loads with the first rendered QR code, not with the app.
 * The box keeps its size meanwhile, and a failed download leaves it empty instead of crashing the app.
 * Each QR code keeps the component it mounted with, so its re-renders never download again, and the
 * empty box re-arms the loader once it has committed, so the next mounted QR code tries once more.
 */
let QrCodeInner: LazyExoticComponent<ComponentType<QrCodeInnerProps>>;

const loadQrCodeInner = (): Promise<{ default: ComponentType<QrCodeInnerProps> }> =>
    import('./QrCodeInner').then(
        module => ({ default: module.QrCodeInner }),
        () => {
            const failedQrCodeInner = QrCodeInner;

            const QrCodeLoadFailed = () => {
                /**
                 * Re-armed after the commit, not in the loader: React renders a tree that has not
                 * committed yet again once the load settles, and a fresh lazy there downloads again.
                 */
                useEffect(() => {
                    if (QrCodeInner === failedQrCodeInner) {
                        QrCodeInner = lazy(loadQrCodeInner);
                    }
                }, []);

                return null;
            };

            return { default: QrCodeLoadFailed };
        },
    );

QrCodeInner = lazy(loadQrCodeInner);

export type QrCodeProps = {
    value: string;
    color?: Color;
    centerIcon?: ReactNode;
    'data-testid'?: string;
};

export const QrCode = ({
    value,
    color = 'contentPrimary',
    centerIcon,
    'data-testid': dataTestId,
}: QrCodeProps) => {
    const [MountedQrCodeInner] = useState(() => QrCodeInner);

    return (
        <Flex position={{ type: 'relative' }} width="100%" height="100%" data-testid={dataTestId}>
            <Suspense fallback={null}>
                <MountedQrCodeInner value={value} color={color} centerIcon={centerIcon} />
            </Suspense>
        </Flex>
    );
};
