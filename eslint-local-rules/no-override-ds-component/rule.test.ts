import { RuleTester } from 'eslint';

import { noOverrideDsComponentRule } from './rule';

const ruleTester = new RuleTester();
const options = [{ packageNames: ['@trezor/components'] }];

ruleTester.run('no-override-ds-component', noOverrideDsComponentRule, {
    valid: [
        {
            code: "import { Button } from '@trezor/components'; const value = Button;",
            options,
        },
        {
            code: "import { Button } from '@other/components'; const StyledButton = styled(Button)`color: red;`;",
            options,
        },
        {
            code: "import { Button } from '@trezor/components'; const StyledCard = styled(Card)`color: red;`;",
            options,
        },
        {
            code: "import { Button } from '@trezor/components'; const StyledButton = styled(Button)`color: red;`;",
        },
    ],
    invalid: [
        {
            code: "import { Button } from '@trezor/components'; const StyledButton = styled(Button)`color: red;`;",
            options,
            errors: [
                {
                    messageId: 'avoidStyledComponent',
                    data: { packageName: '@trezor/components' },
                },
            ],
        },
        {
            code: "import Button from '@trezor/components'; const StyledButton = styled(Button);",
            options,
            errors: [
                {
                    messageId: 'avoidStyledComponent',
                    data: { packageName: '@trezor/components' },
                },
            ],
        },
        {
            code: "import { Button as DsButton } from '@trezor/components'; const StyledButton = styled(DsButton).attrs({})`color: red;`;",
            options,
            errors: [
                {
                    messageId: 'avoidStyledComponent',
                    data: { packageName: '@trezor/components' },
                },
            ],
        },
    ],
});
