import styled from 'styled-components';
import { Modal, ModalProps, H1 } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    text-align: center;
    transition: all 0.3s;
    padding: 0;
    max-height: 90vh;
    max-width: 95vw;
`;

const Header = styled(Modal.Header)`
    margin-bottom: 20px;
`;

/**
 * Alternative renderer for modals, which enables to render modal content "inline", without the backdrop,
 * border etc., mostly in order to nest them to other modals. In the future, it should be reworked completely.
 */
export const RawRenderer = ({
    heading,
    description,
    children,
    bottomBar,
    className,
    'data-test': dataTest,
}: ModalProps) => (
    <Wrapper className={className} data-test={dataTest}>
        {heading && (
            <Header isBottomBorderShown={false}>
                <H1>{heading}</H1>
            </Header>
        )}

        {description && <Modal.Description>{description}</Modal.Description>}

        <Modal.Content>{children}</Modal.Content>

        {bottomBar && <Modal.BottomBar>{bottomBar}</Modal.BottomBar>}
    </Wrapper>
);
