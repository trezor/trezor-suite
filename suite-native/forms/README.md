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
4. Validation schema is considered as source truth for shape of you form and for also is used as source for types, because of that `validation` arg for `useForm` and is mandatory.
