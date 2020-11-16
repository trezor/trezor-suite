@trezor/rollout
=========

[![npm version](https://badge.fury.io/js/%40trezor%2Frollout.svg)](https://badge.fury.io/js/%40trezor%2Frollout)

Tldr: For historical reasons, Trezor devices firmware updates are not always straightforward. 

__Incremental update__: not every firmware update can be applied on any installed firmware. This currently applies only for T1 devices. Releases definitions (see below), contain `min_bootloader_version` and `min_firmware_version`. Depending on whether the device is in bootloader mode or not, respective field (`min_bootloader_version` or `min_firmware_version`) should be observed and next firmware to apply should be evaulated againts them. 

__Incremental downgrade__: it is not possible to downgrade to lower version of bootloader. __Rollout module does not solve this__. Problem is, device will not tell you bootloader version if it is not in bootloader mode. 

__Rollout update__: sometimes we might want to offer firmware only to small portion of users. This behaviour is defined by `rollout` field and handled by this lib.

__Firmware headers__: any firmware that is applied on firmware with bootloader  >= 1.8.0 has old firmware header of 256 bytes, that should be removed before installing. This should be only temporary state and will be solved in future by introducing special intermediate firmwares for updating.
