import battery from './adapters/battery.js'
import serial from './adapters/serial.js'
import audio from './adapters/audio.js'
import gamepad from './adapters/gamepad.js'
import midi from './adapters/midi.js'
import camera from './adapters/camera.js'
import { webusb, webhid } from './adapters/usb.js'
import { ethernet, display, otgPointer, native, placebo } from './adapters/misc.js'

// Order = hand order = scoring order. USB-C first: it's the best-supported port.
export const ADAPTER_FACTORIES = [serial, battery, webusb, audio, display, webhid, midi, camera, gamepad, otgPointer, ethernet, native, placebo]
