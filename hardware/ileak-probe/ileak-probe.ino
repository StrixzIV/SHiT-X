// iLeak Probe — reference firmware for any USB-C dev board with native USB
// (RP2040 / ESP32-S3 / ESP32-C3 / SAMD21). Two wires go into the "flood"
// (a cup of salt water + a 9 V battery for demos — NEVER real flood water).
//
// Outputs, so every kind of host can read it:
//   1. USB CDC serial  → Web Serial adapter (Chrome/Edge desktop, Android)
//        "ILEAK/1 mv=1234\n" at 115200 baud, 10 Hz
//   2. Audio tone on TONE_PIN → 3.5mm / USB-C audio input (works on iOS)
//        freq = 300 Hz + mv / 2   (the web side reads freq/10 as chips)
//
// Wiring: probe A → 100k → ADC_PIN → 100k → GND (divider), probe B → GND.
//         TONE_PIN → 10k → 100nF → TRRS mic ring (sleeve = GND).

const int ADC_PIN = A0;
const int TONE_PIN = 9;
const float VREF_MV = 3300.0;
const float DIVIDER = 2.0;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  pinMode(TONE_PIN, OUTPUT);
}

void loop() {
  long sum = 0;
  for (int i = 0; i < 32; i++) sum += analogRead(ADC_PIN);
  float mv = (sum / 32.0) / 4095.0 * VREF_MV * DIVIDER;

  Serial.print("ILEAK/1 mv=");
  Serial.println((int)mv);

  if (mv > 50) tone(TONE_PIN, 300 + (int)(mv / 2));
  else noTone(TONE_PIN);

  delay(100);
}
