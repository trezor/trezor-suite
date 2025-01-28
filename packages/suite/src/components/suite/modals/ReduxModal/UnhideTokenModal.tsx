import { useState } from 'react';

import {
    DefinitionType,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { Card, Checkbox, H2, NewModal, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { setFlag } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

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
                symbol: account.symbol,
                contractAddress: address,
                status: TokenManagementAction.SHOW,
                type: DefinitionType.COIN,
            }),
        );
        onCancel();
    };

    return (
        <NewModal
            onCancel={onCancel}
            iconName="warning"
            variant="warning"
            bottomContent={
                <>
                    <NewModal.Button onClick={onUnhide}>
                        <Translation id="TR_UNHIDE" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <H2>
                <Translation id="TR_UNHIDE_TOKEN_TITLE" />
            </H2>
            <Paragraph variant="tertiary" margin={{ top: spacings.xs }}>
                <Translation id="TR_UNHIDE_TOKEN_TEXT" />
            </Paragraph>
            <Card margin={{ top: spacings.xl }}>
                <Checkbox isChecked={checked} onClick={() => setChecked(!checked)}>
                    <Translation id="TR_DO_NOT_SHOW_AGAIN" />
                </Checkbox>
            </Card>
        </NewModal>
    );
};
