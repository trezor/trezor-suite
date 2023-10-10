# Trezor device naming in codebase

Development/Internal name consists of 4 keys
<`product_class`> <`platform`> <`feature_class`> <`generation`>

-   `product_class` - `'T'` for Trezor hardware wallet
-   `platform` - `'1'` for STM32F207, `'2'` for STM32F42x
-   `feature_class` - `'B'` for Buttons, `'T'` for Touch
-   `generation`

| Official name  | Development name |
| :------------: | :--------------: |
| Trezor Model 1 |       T1B1       |
| Trezor Model T |       T2T1       |
| Trezor Safe 3  |       T2B1       |
