import styled from 'styled-components';

import { Button, ButtonProps } from '@trezor/components';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledButton = styled(Button)`
    min-height: 53px;
`;

export const SecurityCheckButton = (props: ButtonProps) => <StyledButton {...props} />;
