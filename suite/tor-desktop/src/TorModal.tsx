import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectIsTorLoading } from '@suite/tor';
import { H3, Modal, Paragraph } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { TorBrowserIcon } from '@trezor/icons';

export type TorResult = 'use-defaults' | 'enable-tor';

type TorModalProps = {
    onResult: (result: TorResult) => void;
};

export const TorModal = ({ onResult }: TorModalProps) => {
    const isTorLoading = useSelector(selectIsTorLoading);

    return (
        <Modal
            bottomContent={
                <>
                    {isDesktop() && (
                        <Modal.Button
                            isLoading={isTorLoading}
                            onClick={() => onResult('enable-tor')}
                        >
                            <Translation id="TR_TOR_ENABLE_AND_CONFIRM" />
                        </Modal.Button>
                    )}
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={() => onResult('use-defaults')}
                    >
                        <Translation id="TR_USE_DEFAULT_BACKENDS" />
                    </Modal.Button>
                </>
            }
            width={600}
            icon={TorBrowserIcon}
        >
            <H3>
                <Translation id="TR_TOR_ENABLE" />
            </H3>
            <Paragraph intent="neutral" priority="secondary">
                <Translation id="TR_ONION_BACKEND_TOR_NEEDED" />
            </Paragraph>
        </Modal>
    );
};
