// MarineGuard AI - Web Audio Sonar Acoustics Synthesizer
// Generates realistic underwater acoustic hydrophone pings & telemetry chirps

class SonarAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.35;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playSonarPing() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Primary acoustic pulse (chirp from 1800Hz down to 900Hz)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Underwater bandpass acoustic characteristics
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(4.0, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.18);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(this.volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.0);

      // Hydrophone seabed reverberation echo
      setTimeout(() => {
        if (this.muted || !this.ctx) return;
        const echoNow = this.ctx.currentTime;
        const echoOsc = this.ctx.createOscillator();
        const echoGain = this.ctx.createGain();
        const echoFilter = this.ctx.createBiquadFilter();

        echoFilter.type = 'lowpass';
        echoFilter.frequency.setValueAtTime(900, echoNow);

        echoOsc.type = 'sine';
        echoOsc.frequency.setValueAtTime(950, echoNow);
        echoOsc.frequency.exponentialRampToValueAtTime(600, echoNow + 0.25);

        echoGain.gain.setValueAtTime(0.0001, echoNow);
        echoGain.gain.linearRampToValueAtTime(this.volume * 0.25, echoNow + 0.03);
        echoGain.gain.exponentialRampToValueAtTime(0.0001, echoNow + 0.6);

        echoOsc.connect(echoFilter);
        echoFilter.connect(echoGain);
        echoGain.connect(this.ctx.destination);

        echoOsc.start(echoNow);
        echoOsc.stop(echoNow + 0.65);
      }, 160);

    } catch (e) {
      console.warn("Audio ping error:", e);
    }
  }

  playAnomalyAlert() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(980, now);
      osc1.frequency.setValueAtTime(1320, now + 0.08);

      osc2.frequency.setValueAtTime(1960, now);
      osc2.frequency.setValueAtTime(2640, now + 0.08);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.4, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } catch (e) {
      console.warn("Anomaly alert error:", e);
    }
  }

  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      // ignore
    }
  }
}

export const sonarAudio = new SonarAudioEngine();
