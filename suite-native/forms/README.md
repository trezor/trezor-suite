# @suite-native/forms

Small wrapper around react-hook-form to make usage easier.

## Usage

```tsx
import { yup } from '@trezor/validation';
import { useForm, Form, TextInputField } from '@suite-native/forms';
import { Button } from '@suite-native/atoms';

// Do not use yup.object().shape() - it will broke yup.InferType, use just yup.object({ firstName: ... }) instead
const myFormValidationSchema = yup.object({
    firstName: yup.string().required(),
    lastName: yup.string().required(),
});

type MyFormValues = yup.InferType<typeof myFormValidationSchema>;

export const MyForm = () => {
    const form = useForm<MyFormValues>({ validation: myFormValidationSchema });
    const { handleSubmit } = form;

    const onSubmit = (values: MyFormValues) => {
        console.log(values);
    };

    return (
        <Form form={form}>
            <TextInputField name="firstName" label="Xpub address" />
            <TextInputField name="lastName" label="Xpub address" />

            <Button
                onPress={() => {
                    handleSubmit(onSubmit);
                }}
            >
                Submit
            </Button>
        </Form>
    );
};
```

As you may noticed usage is very similar to react-hook-form, but there are few differences:

1. You need always wrap you form with `Form` component and pass `form` prop.
2. You are allowed to use `Field` components only, if you don't find one you need, you can implement it using `useField` hook.
3. `useForm` hook accepts `validation` arg, which is `yup` schema, you don't need to use `yupResolver` because this is handled automatically.
4. The form values type comes from the generic or `defaultValues`. The third generic is the type `handleSubmit` receives, which is the output of the `validation` schema and is checked against it. When the schema transforms values (e.g. a `number` field over a `string` input) or validates only some fields, pass that output type, e.g. `useForm<FormValues, object, yup.InferType<typeof schema>>`. `validation` is optional only when the form values already satisfy the submitted type.
