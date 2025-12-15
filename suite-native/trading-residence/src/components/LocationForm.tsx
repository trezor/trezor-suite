import { type ReactNode } from 'react';

import { Form } from '@suite-native/forms';

import { useLocationForm } from '../hooks/useLocationForm';

export type LocationFormProps = {
    children: ReactNode;
};

export const LocationForm = ({ children }: LocationFormProps) => {
    const form = useLocationForm();

    return <Form form={form}>{children}</Form>;
};
