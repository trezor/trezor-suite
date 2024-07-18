import styled from 'styled-components';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { Button } from '@trezor/components';
import { DialogModal } from '../Modal/DialogRenderer';
import {
    DefinitionType,
    tokenDefinitionsActions,
    TokenManagementAction,
} from '@suite-common/token-definitions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite';

const StyledModal = styled(DialogModal)`
    width: 600px;
`;

interface UnhideTokenModalProps {
    address: string;
    onCancel: () => void;
}

export const UnhideTokenModal = ({ address, onCancel }: UnhideTokenModalProps) => {
    const account = useSelector(selectSelectedAccount);
    const dispatch = useDispatch();

    if (!account) return null;

    const onUnhide = () => {
        dispatch(
            tokenDefinitionsActions.setTokenStatus({
                networkSymbol: account.symbol,
                contractAddress: address,
                status: TokenManagementAction.SHOW,
                type: DefinitionType.COIN,
            }),
        );
        onCancel();
    };

    return (
        <StyledModal
            isCancelable
            onCancel={onCancel}
            icon="warningTriangleLight"
            iconVariant="warning"
            bodyHeading={<Translation id="TR_UNHIDE_TOKEN_TITLE" />}
            text={<Translation id="TR_UNHIDE_TOKEN_TEXT" />}
            bottomBarComponents={
                <>
                    <Button variant="warning" onClick={onUnhide}>
                        <Translation id="TR_UNHIDE" />
                    </Button>
                    <Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Button>
                </>
            }
        />
    );
};
