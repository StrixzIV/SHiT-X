import battery from './adapters/battery.js'
import serial from './adapters/serial.js'
import audio from './adapters/audio.js'
import gamepad from './adapters/gamepad.js'
import { webusb, webhid } from './adapters/usb.js'
import { ethernet, display, otgPointer, native, placebo } from './adapters/misc.js'

// Order = hand order = scoring order. USB-C first: it's the best-supported port.
export const ADAPTER_FACTORIES = [serial, battery, webusb, audio, display, webhid, gamepad, otgPointer, ethernet, native, placebo]
