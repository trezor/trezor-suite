import React from 'react';
import styled from 'styled-components';
import { Button, P } from '@trezor/components';
import { Modal, Translation } from '@suite-components';
import { isDesktop } from '@suite-utils/env';

const Content = styled(P)`
    margin: 16px 0;
`;

export type TorResult = 'cancel' | 'use-defaults' | 'enable-tor';

type TorModalProps = {
    onResult: (result: TorResult) => void;
};

export const TorModal = ({ onResult }: TorModalProps) => (
    <Modal
        cancelable
        heading={<Translation id="TR_TOR_ENABLE" />}
        onCancel={() => onResult('cancel')}
        bottomBar={
            <>
                <Button variant="secondary" onClick={() => onResult('use-defaults')}>
                    <Translation id="TR_USE_DEFAULT_BACKENDS" />
                </Button>
                {isDesktop() && (
                    <Button variant="primary" onClick={() => onResult('enable-tor')}>
                        <Translation id="TR_TOR_ENABLE_AND_CONFIRM" />
                    </Button>
                )}
            </>
        }
    >
        <Content>
            <Translation id="TR_ONION_BACKEND_TOR_NEEDED" />
        </Content>
    </Modal>
);
