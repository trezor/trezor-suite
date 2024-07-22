import styled from 'styled-components';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { Button, Checkbox } from '@trezor/components';
import { DialogModal } from '../Modal/DialogRenderer';
import {
    DefinitionType,
    tokenDefinitionsActions,
    TokenManagementAction,
} from '@suite-common/token-definitions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from 'src/hooks/suite';
import { useState } from 'react';
import { spacings } from '@trezor/theme';
import { setFlag } from 'src/actions/suite/suiteActions';

const StyledModal = styled(DialogModal)`
    width: 600px;
`;

interface UnhideTokenModalProps {
    address: string;
    onCancel: () => void;
}

export const UnhideTokenModal = ({ address, onCancel }: UnhideTokenModalProps) => {
    const [checked, setChecked] = useState(false);

    const account = useSelector(selectSelectedAccount);
    const dispatch = useDispatch();

    if (!account) return null;

    const onUnhide = () => {
        if (checked) {
            dispatch(setFlag('showUnhideTokenModal', false));
        }
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
            body={
                <>
                    <Translation id="TR_UNHIDE_TOKEN_TEXT" />
                    <Checkbox
                        isChecked={checked}
                        onClick={() => setChecked(!checked)}
                        margin={{ top: spacings.md }}
                    >
                        <Translation id="TR_DO_NOT_SHOW_AGAIN" />
                    </Checkbox>
                </>
            }
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
