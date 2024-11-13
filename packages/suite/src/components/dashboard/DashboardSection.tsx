import { Ref, forwardRef, ReactElement, HTMLAttributes } from 'react';

import { H3, Column, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

type DashboardSectionProps = HTMLAttributes<HTMLDivElement> & {
    heading: ReactElement;
    actions?: ReactElement;
    'data-testid'?: string;
};

export const DashboardSection = forwardRef(
    (
        { heading, actions, children, 'data-testid': dataTestId, ...rest }: DashboardSectionProps,
        ref: Ref<HTMLDivElement>,
    ) => (
        <div ref={ref} {...rest}>
            <Column alignItems="normal" data-testid={dataTestId}>
                <Row as="header" justifyContent="space-between" margin={{ bottom: spacings.lg }}>
                    {heading && (
                        <H3>
                            <Row as="span">{heading}</Row>
                        </H3>
                    )}
                    {actions && <div>{actions}</div>}
                </Row>
                {children}
            </Column>
        </div>
    ),
);
