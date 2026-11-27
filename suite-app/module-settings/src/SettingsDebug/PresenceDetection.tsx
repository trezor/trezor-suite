import { getPresenceDiagnosticsRows, selectPresenceDiagnostics } from '@suite/regions';
import { SectionItem } from '@trezor/product-components';
import { useSelector } from '@trezor/suite';

export const PresenceDetection = () => {
    const diagnostics = useSelector(selectPresenceDiagnostics);

    return getPresenceDiagnosticsRows(diagnostics).map(({ label, value }) => (
        <SectionItem key={label} title={label} description={value} />
    ));
};
