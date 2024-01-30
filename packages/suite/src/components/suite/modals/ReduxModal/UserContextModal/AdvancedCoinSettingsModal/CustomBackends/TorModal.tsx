import styled from 'styled-components';
import { Button, Paragraph } from '@trezor/components';
import { Modal, Translation } from 'src/components/suite';
import { isDesktop } from '@trezor/env-utils';
import { useSelector } from 'src/hooks/suite/useSelector';
import { getIsTorLoading } from 'src/utils/suite/tor';

const StyledModal = styled(Modal)`
    width: 550px;
`;

const Content = styled(Paragraph)`
    margin: 16px 0;
`;

export type TorResult = 'use-defaults' | 'enable-tor';

type TorModalProps = {
    onResult: (result: TorResult) => void;
};

export const TorModal = ({ onResult }: TorModalProps) => {
    const isTorLoading = useSelector(state => getIsTorLoading(state.suite.torStatus));

    return (
        <StyledModal
            heading={<Translation id="TR_TOR_ENABLE" />}
            bottomBarComponents={
                <>
                    <Button variant="tertiary" onClick={() => onResult('use-defaults')}>
                        <Translation id="TR_USE_DEFAULT_BACKENDS" />
                    </Button>

                    {isDesktop() && (
                        <Button
                            variant="primary"
                            isLoading={isTorLoading}
                            onClick={() => onResult('enable-tor')}
                        >
                            <Translation id="TR_TOR_ENABLE_AND_CONFIRM" />
                        </Button>
                    )}
                </>
            }
        >
            <Content>
                <Translation id="TR_ONION_BACKEND_TOR_NEEDED" />
            </Content>
        </StyledModal>
    );
};
