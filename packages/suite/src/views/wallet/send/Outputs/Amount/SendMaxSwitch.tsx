import { Switch } from '@trezor/components';

import { Translation } from 'src/components/suite';

type SendMaxSwitchProps = {
    isSendMaxActive: boolean;
    'data-testid'?: string;
    onChange: () => void;
};

export const SendMaxSwitch = ({
    isSendMaxActive,
    'data-testid': dataTest,
    onChange,
}: SendMaxSwitchProps) => (
    <Switch
        labelPosition="start"
        isChecked={isSendMaxActive}
        data-testid={dataTest}
        size="small"
        onChange={onChange}
        label={<Translation id="AMOUNT_SEND_MAX" />}
    />
);
