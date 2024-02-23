import styled from 'styled-components';
import { Button, Dropdown, DropdownMenuItemProps } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { sendRaw } from 'src/actions/wallet/sendFormActions';
import { WalletSubpageHeading } from 'src/components/wallet';
import { FADE_IN } from '@trezor/components/src/config/animations';

const ClearButton = styled(Button)`
    animation: ${FADE_IN} 0.16s;
`;

export const Header = () => {
    const dispatch = useDispatch();
    const {
        outputs,
        account: { networkType },
        formState: { isDirty },

        addOpReturn,
        resetContext,
        loadTransaction,
    } = useSendFormContext();

    const opreturnOutput = (outputs || []).find(o => o.type === 'opreturn');
    const options: Array<DropdownMenuItemProps> = [
        {
            key: 'opreturn',
            'data-test': '@send/header-dropdown/opreturn',
            onClick: addOpReturn,
            label: <Translation id="OP_RETURN_ADD" />,
            isDisabled: !!opreturnOutput,
            isHidden: networkType !== 'bitcoin',
        },
        {
            key: 'import',
            'data-test': '@send/header-dropdown/import',
            onClick: () => {
                loadTransaction();
            },
            label: <Translation id="IMPORT_CSV" />,
            isHidden: networkType !== 'bitcoin',
        },
        {
            key: 'raw',
            'data-test': '@send/header-dropdown/raw',
            onClick: () => {
                dispatch(sendRaw(true));
            },
            label: <Translation id="SEND_RAW" />,
        },
    ];

    return (
        <WalletSubpageHeading title="TR_NAV_SEND">
            {isDirty && (
                <ClearButton
                    size="small"
                    variant="tertiary"
                    onClick={resetContext}
                    data-test="clear-form"
                >
                    <Translation id="TR_CLEAR_ALL" />
                </ClearButton>
            )}

            <Dropdown
                alignMenu="bottom-right"
                data-test="@send/header-dropdown"
                items={[
                    {
                        key: 'header',
                        options,
                    },
                ]}
            />
        </WalletSubpageHeading>
    );
};
