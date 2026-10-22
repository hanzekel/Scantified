// Web Audio API synthesizer for clean, instant tactile check-in chime without external audio files

export function isAudioMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("scantified_audio_muted") === "true";
  } catch {
    return false;
  }
}

export function setAudioMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("scantified_audio_muted", muted ? "true" : "false");
    window.dispatchEvent(new Event("scantified_audio_muted_changed"));
  } catch {}
}

export function playCelebrationChime() {
  if (typeof window === "undefined") return;
  if (isAudioMuted()) return;

  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Play a cheerful upward arpeggio: C5 (523.25Hz) -> E5 (659.25Hz) -> G5 (783.99Hz) -> C6 (1046.50Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const now = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      // Smooth attack and decay envelope
      const startTime = now + index * 0.08;
      const duration = 0.35;

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });

    // Mobile tactile haptic vibration (pattern: short burst, pause, short burst)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([40, 50, 60]);
    }
  } catch (err) {
    console.debug("Web Audio chime omitted:", err);
  }
}

