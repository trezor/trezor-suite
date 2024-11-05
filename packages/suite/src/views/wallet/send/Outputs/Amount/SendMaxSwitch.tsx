import { Switch } from '@trezor/components';

import { Translation } from 'src/components/suite';

type SendMaxSwitchProps = {
    isSetMaxActive: boolean;
    'data-testid'?: string;
    onChange: () => void;
};

export const SendMaxSwitch = ({
    isSetMaxActive,
    'data-testid': dataTest,
    onChange,
}: SendMaxSwitchProps) => (
    <Switch
        labelPosition="left"
        isChecked={isSetMaxActive}
        data-testid={dataTest}
        isSmall
        onChange={onChange}
        label={<Translation id="AMOUNT_SEND_MAX" />}
    />
);
