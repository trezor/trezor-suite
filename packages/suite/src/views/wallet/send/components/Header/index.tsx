import { Dropdown, DropdownMenuItemProps } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { sendRaw } from 'src/actions/wallet/sendFormActions';
import { Clear } from './components/Clear';
import { WalletLayoutHeader } from 'src/components/wallet';

export const Header = () => {
    const dispatch = useDispatch();
    const {
        outputs,
        account: { networkType },
        addOpReturn,
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
            onClick: () => {
                loadTransaction();
            },
            label: <Translation id="IMPORT_CSV" />,
            isHidden: networkType !== 'bitcoin',
        },
        {
            key: 'raw',
            onClick: () => {
                dispatch(sendRaw(true));
            },
            label: <Translation id="SEND_RAW" />,
        },
    ];

    return (
        <WalletLayoutHeader title="TR_NAV_SEND">
            <Clear />
            <Dropdown
                alignMenu="right"
                data-test="@send/header-dropdown"
                items={[
                    {
                        key: 'header',
                        options,
                    },
                ]}
            />
        </WalletLayoutHeader>
    );
};
