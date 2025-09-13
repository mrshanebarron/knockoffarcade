/**
 * Audio Manager for KnockoffArcade
 * Handles all sound effects and background music
 */

export class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.context = null;
    this.masterVolume = 0.7;
    this.sfxVolume = 0.8;
    this.musicVolume = 0.3;
    this.musicVolumeReduced = 0.01;
    this.voiceVolume = 1.5;
    this.isInitialized = false;
    this.isMuted = false;
    this.userHasInteracted = false;
    this.hasPlayedFirstTrack = false;

    // Music system
    this.backgroundMusic = null;
    this.spikeMusic = null;
    this.currentMusic = null;
    this.musicGain = null;
    this.currentMusicSource = null; // Track current audio source

    // Western-themed sound definitions
    this.soundDefinitions = {
      // Gunshot for paddle hits
      paddleHit: {
        type: 'gunshot',
        duration: 0.15,
        volume: 0.8,
        envelope: { attack: 0.001, decay: 0.05, sustain: 0.1, release: 0.094 }
      },

      // Spittoon pings for brick breaking (different pitches)
      brickBreak1: {
        type: 'spittoon',
        frequency: 800,
        duration: 0.2,
        volume: 0.7,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.09 }
      },

      brickBreak2: {
        type: 'spittoon',
        frequency: 600,
        duration: 0.18,
        volume: 0.6,
        envelope: { attack: 0.01, decay: 0.08, sustain: 0.4, release: 0.09 }
      },

      brickBreak3: {
        type: 'spittoon',
        frequency: 400,
        duration: 0.22,
        volume: 0.5,
        envelope: { attack: 0.01, decay: 0.12, sustain: 0.5, release: 0.08 }
      },

      // Saloon door creak for power-ups
      powerUpCollect: {
        type: 'saloon_door',
        startFreq: 200,
        endFreq: 150,
        duration: 0.4,
        volume: 0.6,
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.25 }
      },

      // Dramatic "Aww shucks" whistle for ball lost
      ballLost: {
        type: 'whistle_down',
        startFreq: 800,
        endFreq: 200,
        duration: 0.8,
        volume: 0.8,
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.4, release: 0.3 }
      },

      // Victory harmonica melody
      levelComplete: {
        type: 'harmonica',
        notes: [392, 440, 523, 659, 784], // G4, A4, C5, E5, G5 - Western scale
        duration: 1.2,
        volume: 0.7,
        envelope: { attack: 0.1, decay: 0.05, sustain: 0.8, release: 0.05 }
      },

      // Dramatic Western chord progression
      gameOver: {
        type: 'western_chord',
        chords: [
          [220, 277, 330], // A minor
          [196, 247, 294], // G minor
          [175, 220, 262]  // F minor
        ],
        duration: 1.5,
        volume: 0.9,
        envelope: { attack: 0.2, decay: 0.3, sustain: 0.6, release: 0.4 }
      },

      // "Yeehaw!" vocal effects for combos
      combo3: {
        type: 'yeehaw',
        formants: [800, 1200, 2500], // Vocal formants for "Yee"
        duration: 0.3,
        volume: 0.5,
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.18 }
      },

      combo5: {
        type: 'yeehaw',
        formants: [600, 1000, 2200], // "Haw" formants
        duration: 0.4,
        volume: 0.6,
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.28 }
      },

      combo10: {
        type: 'yeehaw_big',
        formants: [500, 900, 2000], // Big "YEEHAW!"
        duration: 0.6,
        volume: 0.8,
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.48 }
      },

      // Spur jingle for menu sounds
      menuSelect: {
        type: 'spur',
        frequency: 1200,
        duration: 0.1,
        volume: 0.4,
        envelope: { attack: 0.01, decay: 0.03, sustain: 0.2, release: 0.06 }
      },

      // Horse whinny for menu confirm
      menuConfirm: {
        type: 'whinny',
        startFreq: 400,
        endFreq: 800,
        duration: 0.25,
        volume: 0.5,
        envelope: { attack: 0.02, decay: 0.08, sustain: 0.4, release: 0.15 }
      }
    };

    // Don't initialize audio until user interaction
  }

  async initializeAudio() {
    try {
      // Create Web Audio API context
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.context = new AudioContextClass();

      // Create master gain node
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.context.destination);

      // Create music gain node
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.isInitialized = true;
      console.log('AudioManager initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize Web Audio API:', error);
      this.isInitialized = false;
    }
  }

  async resumeContext() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  async playSound(soundName, options = {}) {
    // Don't play anything if user hasn't interacted yet
    if (!this.userHasInteracted) {
      console.log('Audio blocked - waiting for user interaction');
      return;
    }

    // Initialize audio on first call (after user interaction)
    if (!this.isInitialized) {
      await this.initializeAudio();
    }

    if (!this.isInitialized || this.isMuted || !this.context) {
      return;
    }

    await this.resumeContext();

    const soundDef = this.soundDefinitions[soundName];
    if (!soundDef) {
      console.warn(`Sound '${soundName}' not found`);
      return;
    }

    const volume = (options.volume || soundDef.volume) * this.sfxVolume;
    const now = this.context.currentTime;

    switch (soundDef.type) {
      case 'gunshot':
        this.playGunshot(soundDef, volume, now);
        break;
      case 'spittoon':
        this.playSpittoon(soundDef, volume, now);
        break;
      case 'saloon_door':
        this.playSaloonDoor(soundDef, volume, now);
        break;
      case 'whistle_down':
        this.playWhistleDown(soundDef, volume, now);
        break;
      case 'harmonica':
        this.playHarmonica(soundDef, volume, now);
        break;
      case 'western_chord':
        this.playWesternChord(soundDef, volume, now);
        break;
      case 'yeehaw':
        this.playYeehaw(soundDef, volume, now);
        break;
      case 'yeehaw_big':
        this.playYeehawBig(soundDef, volume, now);
        break;
      case 'spur':
        this.playSpur(soundDef, volume, now);
        break;
      case 'whinny':
        this.playWhinny(soundDef, volume, now);
        break;
    }
  }

  playGunshot(soundDef, volume, startTime) {
    // Create realistic gunshot with multiple components
    this.createGunshotBang(volume, startTime);
    this.createGunshotEcho(volume * 0.4, startTime + 0.1);
    this.createRicochet(volume * 0.6, startTime + 0.05);
  }

  createGunshotBang(volume, startTime) {
    // Sharp crack sound
    const bufferSize = this.context.sampleRate * 0.1;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate explosive noise with realistic profile
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.exp(-t * 50) * (1 - t); // Sharp attack, quick decay
      const noise = (Math.random() * 2 - 1);
      const crack = Math.sin(t * Math.PI * 200) * Math.exp(-t * 30); // Sharp crack component
      output[i] = (noise * 0.7 + crack * 0.3) * envelope;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(400, startTime);
    filter.Q.setValueAtTime(1, startTime);

    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(startTime);
  }

  createGunshotEcho(volume, startTime) {
    // Canyon echo effect
    const delay = this.context.createDelay(0.5);
    const feedback = this.context.createGain();
    const wetGain = this.context.createGain();

    delay.delayTime.setValueAtTime(0.15, startTime);
    feedback.gain.setValueAtTime(0.3, startTime);
    wetGain.gain.setValueAtTime(volume, startTime);

    // Create echo source
    const echoOsc = this.context.createOscillator();
    const echoGain = this.context.createGain();

    echoOsc.type = 'sawtooth';
    echoOsc.frequency.setValueAtTime(100, startTime);
    echoOsc.frequency.linearRampToValueAtTime(50, startTime + 0.8);

    echoGain.gain.setValueAtTime(0, startTime);
    echoGain.gain.linearRampToValueAtTime(volume * 0.3, startTime + 0.1);
    echoGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

    echoOsc.connect(echoGain);
    echoGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain);
    wetGain.connect(this.masterGain);

    echoOsc.start(startTime);
    echoOsc.stop(startTime + 0.8);
  }

  createRicochet(volume, startTime) {
    // Ricochet whine
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, startTime + 0.4);
    oscillator.frequency.linearRampToValueAtTime(150, startTime + 0.6);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.6);
  }

  playSpittoon(soundDef, volume, startTime) {
    // Create metallic ping sound
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(soundDef.frequency, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(soundDef.frequency * 0.7, startTime + soundDef.duration);

    // Add metallic resonance
    filter.type = 'peaking';
    filter.frequency.setValueAtTime(soundDef.frequency * 2, startTime);
    filter.Q.setValueAtTime(15, startTime);
    filter.gain.setValueAtTime(6, startTime);

    this.applyEnvelope(gainNode.gain, soundDef.envelope, volume, startTime, soundDef.duration);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + soundDef.duration);
  }

  // PLACEHOLDER METHODS - Updated to use spittoon
  playSweep(soundDef, volume, startTime) {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(soundDef.startFreq, startTime);
    oscillator.frequency.linearRampToValueAtTime(soundDef.endFreq, startTime + soundDef.duration);

    this.applyEnvelope(gainNode.gain, soundDef.envelope, volume, startTime, soundDef.duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + soundDef.duration);
  }

  playDescending(soundDef, volume, startTime) {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(soundDef.startFreq, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(soundDef.endFreq, startTime + soundDef.duration);

    this.applyEnvelope(gainNode.gain, soundDef.envelope, volume, startTime, soundDef.duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + soundDef.duration);
  }

  // LEGACY METHOD - Updated to use harmonica
  playMelody(soundDef, volume, startTime) {
    this.playHarmonica(soundDef, volume, startTime);
  }

  // LEGACY METHOD - Updated to use western chord
  playDramatic(soundDef, volume, startTime) {
    this.playWesternChord(soundDef, volume, startTime);
  }

  // LEGACY METHOD - Updated to use whinny
  playRising(soundDef, volume, startTime) {
    this.playWhinny(soundDef, volume, startTime);
  }

  // LEGACY METHOD - Updated to use spur
  playBlip(soundDef, volume, startTime) {
    this.playSpur(soundDef, volume, startTime);
  }

  // LEGACY METHOD - Updated to use whinny
  playConfirm(soundDef, volume, startTime) {
    this.playWhinny(soundDef, volume, startTime);
  }

  playSaloonDoor(soundDef, volume, startTime) {
    // Create creaky door sound
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(soundDef.startFreq, startTime);
    oscillator.frequency.linearRampToValueAtTime(soundDef.endFreq, startTime + soundDef.duration * 0.3);
    oscillator.frequency.setValueAtTime(soundDef.endFreq, startTime + soundDef.duration * 0.3);
    oscillator.frequency.linearRampToValueAtTime(soundDef.startFreq * 0.9, startTime + soundDef.duration);

    this.applyEnvelope(gainNode.gain, soundDef.envelope, volume, startTime, soundDef.duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + soundDef.duration);
  }

  playWhistleDown(soundDef, volume, startTime) {
    // Create descending whistle
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(soundDef.startFreq, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(soundDef.endFreq, startTime + soundDef.duration);

    this.applyEnvelope(gainNode.gain, soundDef.envelope, volume, startTime, soundDef.duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + soundDef.duration);
  }

  playHarmonica(soundDef, volume, startTime) {
    // Authentic harmonica with reed simulation and bends
    const noteDuration = soundDef.duration / soundDef.notes.length;

    soundDef.notes.forEach((frequency, index) => {
      const noteStartTime = startTime + (index * noteDuration);
      this.createHarmonicaNote(frequency, volume * 0.8, noteStartTime, noteDuration);
    });
  }

  createHarmonicaNote(frequency, volume, startTime, duration) {
    // Multiple oscillators to simulate harmonica reed overtones
    const fundamental = this.context.createOscillator();
    const overtone1 = this.context.createOscillator();
    const overtone2 = this.context.createOscillator();

    // Vibrato oscillators
    const vibrato = this.context.createOscillator();
    const vibratoGain = this.context.createGain();

    // Filter for reed resonance
    const filter = this.context.createBiquadFilter();
    const gainNode = this.context.createGain();

    // Main fundamental frequency with slight detuning
    fundamental.type = 'sawtooth';
    fundamental.frequency.setValueAtTime(frequency, startTime);

    // Add slight bend at the beginning (characteristic of harmonica)
    fundamental.frequency.linearRampToValueAtTime(frequency * 0.98, startTime + 0.05);
    fundamental.frequency.linearRampToValueAtTime(frequency, startTime + 0.1);

    // Overtones for rich harmonica timbre
    overtone1.type = 'triangle';
    overtone1.frequency.setValueAtTime(frequency * 2, startTime);

    overtone2.type = 'sine';
    overtone2.frequency.setValueAtTime(frequency * 3, startTime);

    // Vibrato (characteristic harmonica wobble)
    vibrato.type = 'sine';
    vibrato.frequency.setValueAtTime(5.5, startTime); // 5.5Hz vibrato
    vibratoGain.gain.setValueAtTime(frequency * 0.02, startTime); // 2% vibrato depth

    vibrato.connect(vibratoGain);
    vibratoGain.connect(fundamental.frequency);
    vibratoGain.connect(overtone1.frequency);

    // Reed resonance filter
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency * 2, startTime);
    filter.Q.setValueAtTime(3, startTime);

    // Mix oscillators
    const mixer = this.context.createGain();
    const overtone1Gain = this.context.createGain();
    const overtone2Gain = this.context.createGain();

    overtone1Gain.gain.setValueAtTime(0.3, startTime);
    overtone2Gain.gain.setValueAtTime(0.15, startTime);

    fundamental.connect(mixer);
    overtone1.connect(overtone1Gain);
    overtone1Gain.connect(mixer);
    overtone2.connect(overtone2Gain);
    overtone2Gain.connect(mixer);

    mixer.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Harmonica breathing envelope (soft attack, sustain, gentle release)
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.1);
    gainNode.gain.setValueAtTime(volume * 0.9, startTime + duration * 0.7);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, startTime + duration * 0.9);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Start all oscillators
    fundamental.start(startTime);
    overtone1.start(startTime);
    overtone2.start(startTime);
    vibrato.start(startTime);

    // Stop all oscillators
    fundamental.stop(startTime + duration);
    overtone1.stop(startTime + duration);
    overtone2.stop(startTime + duration);
    vibrato.stop(startTime + duration);
  }

  playWesternChord(soundDef, volume, startTime) {
    // Play dramatic chord progression
    const chordDuration = soundDef.duration / soundDef.chords.length;

    soundDef.chords.forEach((chord, chordIndex) => {
      const chordStartTime = startTime + (chordIndex * chordDuration);

      chord.forEach((frequency, noteIndex) => {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(frequency, chordStartTime);

        const noteVolume = volume / chord.length; // Distribute volume across notes
        this.applyEnvelope(gainNode.gain, soundDef.envelope, noteVolume, chordStartTime, chordDuration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(chordStartTime);
        oscillator.stop(chordStartTime + chordDuration);
      });
    });
  }

  playYeehaw(soundDef, volume, startTime) {
    // Create vocal formants for "Yeehaw"
    soundDef.formants.forEach((formant, index) => {
      const oscillator = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      const gainNode = this.context.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150 + index * 50, startTime); // Base frequency

      filter.type = 'peaking';
      filter.frequency.setValueAtTime(formant, startTime);
      filter.Q.setValueAtTime(5, startTime);
      filter.gain.setValueAtTime(10, startTime);

      const formantVolume = volume / soundDef.formants.length;
      this.applyEnvelope(gainNode.gain, soundDef.envelope, formantVolume, startTime, soundDef.duration);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(startTime);
      oscillator.stop(startTime + soundDef.duration);
    });
  }

  playYeehawBig(soundDef, volume, startTime) {
    // Big "YEEHAW!" with more formants and vibrato
    soundDef.formants.forEach((formant, index) => {
      const oscillator = this.context.createOscillator();
      const vibrato = this.context.createOscillator();
      const vibratoGain = this.context.createGain();
      const filter = this.context.createBiquadFilter();
      const gainNode = this.context.createGain();

      oscillator.type = 'sawtooth';
      const baseFreq = 120 + index * 60;
      oscillator.frequency.setValueAtTime(baseFreq, startTime);

      // Add vibrato
      vibrato.type = 'sine';
      vibrato.frequency.setValueAtTime(5, startTime);
      vibratoGain.gain.setValueAtTime(10, startTime);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(oscillator.frequency);

      filter.type = 'peaking';
      filter.frequency.setValueAtTime(formant, startTime);
      filter.Q.setValueAtTime(8, startTime);
      filter.gain.setValueAtTime(15, startTime);

      const formantVolume = volume / soundDef.formants.length;
      this.applyEnvelope(gainNode.gain, soundDef.envelope, formantVolume, startTime, soundDef.duration);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(startTime);
      vibrato.start(startTime);
      oscillator.stop(startTime + soundDef.duration);
      vibrato.stop(startTime + soundDef.duration);
    });
  }

  playSpur(soundDef, volume, startTime) {
    // Create spur jingle sound
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(soundDef.frequency, startTime);
    oscillator.frequency.linearRampToValueAtTime(soundDef.frequency * 1.2, startTime + soundDef.duration * 0.3);
    oscillator.frequency.linearRampToValueAtTime(soundDef.frequency, startTime + soundDef.duration);

    this.applyEnvelope(gainNode.gain, soundDef.envelope, volume, startTime, soundDef.duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + soundDef.duration);
  }

  playWhinny(soundDef, volume, startTime) {
    // Realistic horse whinny with multiple components
    this.createWhinnyCall(soundDef, volume, startTime);
    this.createWhinnyBreathe(volume * 0.6, startTime + 0.1);
    this.createWhinnyTail(volume * 0.4, startTime + soundDef.duration * 0.7);
  }

  createWhinnyCall(soundDef, volume, startTime) {
    // Main whinny call with characteristic frequency sweep
    const osc1 = this.context.createOscillator();
    const osc2 = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gainNode = this.context.createGain();

    // Two oscillators for richer timbre
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    // Characteristic horse whinny frequency pattern
    osc1.frequency.setValueAtTime(soundDef.startFreq, startTime);
    osc1.frequency.linearRampToValueAtTime(soundDef.endFreq, startTime + 0.1);
    osc1.frequency.linearRampToValueAtTime(soundDef.startFreq * 0.7, startTime + 0.15);
    osc1.frequency.linearRampToValueAtTime(soundDef.endFreq * 1.2, startTime + 0.2);
    osc1.frequency.exponentialRampToValueAtTime(soundDef.startFreq * 0.6, startTime + soundDef.duration);

    // Second oscillator slightly detuned
    osc2.frequency.setValueAtTime(soundDef.startFreq * 1.02, startTime);
    osc2.frequency.linearRampToValueAtTime(soundDef.endFreq * 1.02, startTime + 0.1);
    osc2.frequency.linearRampToValueAtTime(soundDef.startFreq * 0.72, startTime + 0.15);
    osc2.frequency.linearRampToValueAtTime(soundDef.endFreq * 1.22, startTime + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(soundDef.startFreq * 0.62, startTime + soundDef.duration);

    // Filter to simulate horse vocal tract
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, startTime);
    filter.frequency.linearRampToValueAtTime(1200, startTime + 0.1);
    filter.frequency.linearRampToValueAtTime(600, startTime + soundDef.duration);
    filter.Q.setValueAtTime(2, startTime);

    // Whinny envelope (sharp attack, irregular sustain)
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.03);
    gainNode.gain.setValueAtTime(volume * 0.8, startTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(volume * 0.9, startTime + 0.15);
    gainNode.gain.setValueAtTime(volume * 0.6, startTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + soundDef.duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + soundDef.duration);
    osc2.stop(startTime + soundDef.duration);
  }

  createWhinnyBreathe(volume, startTime) {
    // Breathing/snort component
    const bufferSize = this.context.sampleRate * 0.15;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate breathing noise
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.sin(t * Math.PI) * 0.7;
      output[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, startTime);
    filter.Q.setValueAtTime(0.5, startTime);

    gainNode.gain.setValueAtTime(volume, startTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(startTime);
  }

  createWhinnyTail(volume, startTime) {
    // Soft trailing off sound
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(120, startTime + 0.3);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.3);
  }

  applyEnvelope(gainParam, envelope, maxVolume, startTime, duration) {
    const { attack, decay, sustain, release } = envelope;
    const sustainLevel = maxVolume * sustain;

    gainParam.setValueAtTime(0, startTime);
    gainParam.linearRampToValueAtTime(maxVolume, startTime + attack);
    gainParam.linearRampToValueAtTime(sustainLevel, startTime + attack + decay);
    gainParam.setValueAtTime(sustainLevel, startTime + duration - release);
    gainParam.exponentialRampToValueAtTime(0.001, startTime + duration);
  }

  // Random brick break sound selection
  playBrickBreak() {
    const sounds = ['brickBreak1', 'brickBreak2', 'brickBreak3'];
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    this.playSound(randomSound);
  }

  // Combo sound based on combo count
  playComboSound(comboCount) {
    if (comboCount >= 10) {
      this.playSound('combo10');
    } else if (comboCount >= 5) {
      this.playSound('combo5');
    } else if (comboCount >= 3) {
      this.playSound('combo3');
    }
  }

  // Music system methods
  // REMOVED: createBackgroundMusic() - We only use audio files now

  // REMOVED: createSpikeMusic() - We only use audio files now

  async startBackgroundMusic() {
    console.log('startBackgroundMusic called');

    // Mark that user has interacted
    this.userHasInteracted = true;

    // Initialize audio on first call (after user interaction)
    if (!this.isInitialized) {
      console.log('Initializing audio after user interaction');
      await this.initializeAudio();
    }

    console.log('Audio context state:', this.context ? this.context.state : 'no context');
    console.log('Is initialized:', this.isInitialized);
    console.log('Is muted:', this.isMuted);

    // Setup music files if not already done
    if (!this.musicFiles) {
      this.musicFiles = [
        './assets/sounds/harmonica 1 tunes - bar 141 - Eitan Epstein Music - main.wav',
        './assets/sounds/The Western short version.wav',
        './assets/sounds/Western.mp3',
        './assets/sounds/Western (Full Version).mp3',
        './assets/sounds/Country Western/Country Western 01.mp3',
        './assets/sounds/Country/Country.mp3',
        './assets/sounds/Country Ways.mp3',
        './assets/sounds/Lady Fortune.mp3',
        './assets/sounds/Traveling Through.mp3',
        './assets/sounds/CountryHoedown_96_JHungerX.wav',
        './assets/sounds/Funny Country.wav',
        './assets/sounds/Uplifting Country 2.wav',
        './assets/sounds/acd c tunes 02a - bar 1225 - eitan-ep - main.wav'
      ];
      this.currentTrackIndex = 0;
    }

    // Stop any currently playing music to prevent overlapping
    this.stopCurrentMusic();

    // Set current music to audio files only - NO SYNTHESIZED MUSIC!
    this.currentMusic = { melody: 'audio_files', type: 'background', startTime: this.context.currentTime };

    // Play audio files directly
    this.playNextAudioTrack();
  }

  startSpikeMusic() {
    // Don't interrupt the WAV file music for spike events
    // The WAV files are the primary music system now
    return;
  }


  async playNextAudioTrack() {
    if (!this.isInitialized || this.isMuted || !this.currentMusic) return;

    try {
      // CRITICAL: Stop any currently playing music to prevent overlapping
      this.stopCurrentMusic();

      // Ensure audio context is resumed (required by modern browsers)
      await this.resumeContext();

      // Cycle through main songs only
      const trackPath = this.musicFiles[this.currentTrackIndex % this.musicFiles.length];
      console.log(`Loading main song: ${trackPath}`);

      // Fetch and decode the audio file
      const response = await fetch(trackPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${trackPath}: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      console.log(`Track loaded: ${trackPath}, duration: ${audioBuffer.duration}s`);

      // Create and configure the audio source
      const source = this.context.createBufferSource();
      source.buffer = audioBuffer;

      // Store this source so we can stop it if needed
      this.currentMusicSource = source;

      // Create a gain node for fade-in effect
      const trackGain = this.context.createGain();
      source.connect(trackGain);
      trackGain.connect(this.musicGain);

      // Check if this is the first track (music just started)
      const isFirstTrack = !this.hasPlayedFirstTrack;
      if (isFirstTrack) {
        this.hasPlayedFirstTrack = true;
      }

      // Set initial volume and fade-in if it's the first track
      if (isFirstTrack) {
        trackGain.gain.setValueAtTime(0, this.context.currentTime);
        trackGain.gain.linearRampToValueAtTime(1, this.context.currentTime + 3); // 3-second fade-in
        console.log(`Now playing with fade-in: ${trackPath}`);
      } else {
        trackGain.gain.setValueAtTime(1, this.context.currentTime);
        console.log(`Now playing: ${trackPath}`);
      }

      // Start playing
      source.start(0);

      // Schedule the next track
      const trackDuration = audioBuffer.duration;
      setTimeout(() => {
        if (this.currentMusic && this.currentMusic.melody === 'audio_files') {
          // Move to next song
          this.currentTrackIndex++;

          // Wait 2 seconds between tracks
          setTimeout(() => {
            if (this.currentMusic && this.currentMusic.melody === 'audio_files') {
              this.playNextAudioTrack();
            }
          }, 2000);
        }
      }, trackDuration * 1000);

    } catch (error) {
      console.error('Error playing audio track:', error);
      console.error('Track path:', trackPath);
      console.error('Audio context state:', this.context.state);
      console.error('Is initialized:', this.isInitialized);
      console.error('Is muted:', this.isMuted);

      // Try next track after 3 seconds if current one fails
      setTimeout(() => {
        if (this.currentMusic && this.currentMusic.melody === 'audio_files') {
          // Move to next track and try again
          this.currentTrackIndex++;
          this.playNextAudioTrack();
        }
      }, 3000);
    }
  }

  playMelodyInternal(melody, noteIndex, startTime) {
    if (!this.isInitialized || !this.currentMusic) return;

    if (noteIndex >= melody.length) {
      // Loop the melody after a short pause
      setTimeout(() => {
        if (this.currentMusic && this.currentMusic.melody === melody) {
          this.playMelodyInternal(melody, 0, this.context.currentTime + 1.5);
        }
      }, 1500);
      return;
    }

    const note = melody[noteIndex];
    if (note.note === 0) {
      // Rest - just schedule next note
      setTimeout(() => {
        if (this.currentMusic && this.currentMusic.melody === melody) {
          this.playMelodyInternal(melody, noteIndex + 1, startTime + note.duration);
        }
      }, note.duration * 1000);
      return;
    }

    // Create a richer Western-style instrumentation
    this.playWesternMelodyNote(note.note, note.duration, startTime);
    this.playWesternHarmony(note.note, note.duration, startTime);

    // Schedule next note
    setTimeout(() => {
      if (this.currentMusic && this.currentMusic.melody === melody) {
        this.playMelodyInternal(melody, noteIndex + 1, startTime + note.duration);
      }
    }, note.duration * 1000);
  }

  playWesternMelodyNote(frequency, duration, startTime) {
    // Main melody with guitar-like sound
    const fundamental = this.context.createOscillator();
    const harmonics = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gainNode = this.context.createGain();

    // Guitar-like timbre
    fundamental.type = 'sawtooth';
    fundamental.frequency.setValueAtTime(frequency, startTime);

    harmonics.type = 'triangle';
    harmonics.frequency.setValueAtTime(frequency * 2, startTime);

    // Warm filter for guitar sound
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 4, startTime);
    filter.Q.setValueAtTime(1, startTime);

    // Mix oscillators
    const harmonicsGain = this.context.createGain();
    harmonicsGain.gain.setValueAtTime(0.3, startTime);

    fundamental.connect(filter);
    harmonics.connect(harmonicsGain);
    harmonicsGain.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);

    // Gentle guitar-like envelope
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.4, startTime + 0.1);
    gainNode.gain.setValueAtTime(this.musicVolume * 0.35, startTime + duration * 0.7);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    fundamental.start(startTime);
    harmonics.start(startTime);
    fundamental.stop(startTime + duration);
    harmonics.stop(startTime + duration);
  }

  playWesternHarmony(frequency, duration, startTime) {
    // Add subtle harmonic accompaniment
    const harmonyFreq = frequency * 0.75; // Perfect fifth below
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(harmonyFreq, startTime);

    // Very quiet harmony
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.15, startTime + 0.2);
    gainNode.gain.setValueAtTime(this.musicVolume * 0.1, startTime + duration * 0.8);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.musicGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  playRandomChords() {
    if (!this.isInitialized || !this.currentMusic || this.isMuted) return;

    // Pick a random chord
    const randomChord = this.westernChords[Math.floor(Math.random() * this.westernChords.length)];

    // Fixed duration for 4 beats (assuming 120 BPM = 0.5 seconds per beat)
    const beatsPerMinute = 120;
    const secondsPerBeat = 60 / beatsPerMinute;
    const duration = 4 * secondsPerBeat; // 4 beats = 2 seconds

    // Play Western band arrangement
    this.playAcousticGuitar(randomChord, duration, this.context.currentTime);
    this.playUprigthBass(randomChord, duration, this.context.currentTime);
    this.playBanjo(randomChord, duration, this.context.currentTime + 0.1);
    this.playFiddle(randomChord, duration, this.context.currentTime + 0.3);
    this.playSimpleDrums(duration, this.context.currentTime);

    // Schedule next random chord
    setTimeout(() => {
      if (this.currentMusic && this.currentMusic.melody === 'random_chords') {
        this.playRandomChords();
      }
    }, duration * 1000);
  }

  playAcousticGuitar(chord, duration, startTime) {
    // Strum pattern: down-up-down-up in 4 beats
    const strumTimes = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75];

    strumTimes.forEach((beatOffset, index) => {
      const strumTime = startTime + beatOffset;
      const isDownstroke = index % 2 === 0;

      // Play chord notes with slight delay between strings
      chord.notes.forEach((frequency, stringIndex) => {
        const stringTime = strumTime + (stringIndex * 0.01);
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        // Guitar timbre
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(frequency, stringTime);

        // Guitar body resonance
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(frequency * 4, stringTime);
        filter.Q.setValueAtTime(0.7, stringTime);

        // Strum dynamics
        const volume = (this.musicVolume * 0.15) * (isDownstroke ? 1.0 : 0.7);
        gainNode.gain.setValueAtTime(0, stringTime);
        gainNode.gain.linearRampToValueAtTime(volume, stringTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, stringTime + 0.4);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.musicGain);

        oscillator.start(stringTime);
        oscillator.stop(stringTime + 0.4);
      });
    });
  }

  playUprigthBass(chord, duration, startTime) {
    // Walking bass pattern
    const bassNotes = [chord.bass, chord.bass * 1.25, chord.bass * 1.5, chord.bass * 1.25];
    const beatLength = duration / 4;

    bassNotes.forEach((frequency, beat) => {
      const noteTime = startTime + (beat * beatLength);
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      // Upright bass timbre
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, noteTime);

      // Bass warmth
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(frequency * 3, noteTime);
      filter.Q.setValueAtTime(1.2, noteTime);

      // Bass envelope - punchy attack, warm sustain
      const volume = this.musicVolume * 0.25;
      gainNode.gain.setValueAtTime(0, noteTime);
      gainNode.gain.linearRampToValueAtTime(volume, noteTime + 0.05);
      gainNode.gain.setValueAtTime(volume * 0.6, noteTime + beatLength * 0.8);
      gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + beatLength);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.musicGain);

      oscillator.start(noteTime);
      oscillator.stop(noteTime + beatLength);
    });
  }

  playBanjo(chord, duration, startTime) {
    // Banjo picking pattern - arpeggiated notes
    const pickingPattern = [0, 2, 1, 2, 0, 2, 1, 2]; // Index into chord notes
    const sixteenthNote = duration / 16;

    for (let i = 0; i < 16; i++) {
      if (Math.random() < 0.7) { // Not every note played
        const noteTime = startTime + (i * sixteenthNote);
        const chordIndex = pickingPattern[i % pickingPattern.length];
        const frequency = chord.notes[chordIndex] * (1 + Math.random() * 0.5); // Vary octave

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        // Bright banjo sound
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, noteTime);

        // Banjo brightness
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(frequency * 0.5, noteTime);
        filter.Q.setValueAtTime(0.5, noteTime);

        // Quick pluck
        const volume = this.musicVolume * 0.08;
        gainNode.gain.setValueAtTime(volume, noteTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.musicGain);

        oscillator.start(noteTime);
        oscillator.stop(noteTime + 0.2);
      }
    }
  }

  playFiddle(chord, duration, startTime) {
    // Simple fiddle melody based on chord tones
    const melodyNotes = [
      chord.notes[0] * 2,      // Root up an octave
      chord.notes[1] * 2,      // Third up an octave
      chord.notes[2] * 2,      // Fifth up an octave
      chord.notes[0] * 2.5     // Root up higher
    ];

    const noteLength = duration / 4;

    melodyNotes.forEach((frequency, index) => {
      if (Math.random() < 0.6) { // Sparse melody
        const noteTime = startTime + (index * noteLength);
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        // Fiddle/violin timbre
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(frequency, noteTime);

        // Add vibrato
        const vibrato = this.context.createOscillator();
        const vibratoGain = this.context.createGain();
        vibrato.type = 'sine';
        vibrato.frequency.setValueAtTime(6, noteTime);
        vibratoGain.gain.setValueAtTime(frequency * 0.02, noteTime);

        vibrato.connect(vibratoGain);
        vibratoGain.connect(oscillator.frequency);

        // Fiddle resonance
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(frequency * 1.5, noteTime);
        filter.Q.setValueAtTime(2, noteTime);

        // Bowed envelope
        const volume = this.musicVolume * 0.1;
        gainNode.gain.setValueAtTime(0, noteTime);
        gainNode.gain.linearRampToValueAtTime(volume, noteTime + 0.1);
        gainNode.gain.setValueAtTime(volume * 0.8, noteTime + noteLength * 0.7);
        gainNode.gain.exponentialRampToValueAtTime(0.001, noteTime + noteLength);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.musicGain);

        oscillator.start(noteTime);
        vibrato.start(noteTime);
        oscillator.stop(noteTime + noteLength);
        vibrato.stop(noteTime + noteLength);
      }
    });
  }

  playSimpleDrums(duration, startTime) {
    const beatLength = duration / 4;

    for (let beat = 0; beat < 4; beat++) {
      const beatTime = startTime + (beat * beatLength);

      // Simple kick on 1 and 3
      if (beat === 0 || beat === 2) {
        this.playKickDrum(beatTime);
      }

      // Snare on 2 and 4
      if (beat === 1 || beat === 3) {
        this.playSnare(beatTime);
      }

      // Subtle hi-hat on off-beats
      if (Math.random() < 0.4) {
        this.playHiHat(beatTime + beatLength / 2);
      }
    }
  }

  playRandomMelody(chord, chordDuration, startTime) {
    // Generate a short random melody (3-6 notes)
    const melodyLength = 3 + Math.floor(Math.random() * 4);
    const noteDuration = (chordDuration - 1) / melodyLength; // Leave space at end

    // Get chord-appropriate melody notes
    const chordNotes = this.getChordMelodyNotes(chord);

    for (let i = 0; i < melodyLength; i++) {
      const noteStartTime = startTime + (i * noteDuration);

      // Pick random note that fits the chord
      const randomNote = chordNotes[Math.floor(Math.random() * chordNotes.length)];

      // 20% chance of rest (silence)
      if (Math.random() < 0.2) {
        continue; // Skip this note (create a rest)
      }

      this.playMelodyNote(randomNote, noteDuration * 0.8, noteStartTime); // Slightly shorter than full duration
    }
  }

  getChordMelodyNotes(chord) {
    // Create melody notes that harmonically fit the chord
    const melodyNotes = [];

    // Add the chord tones in higher octaves
    chord.forEach(frequency => {
      melodyNotes.push(frequency * 2);     // One octave up
      melodyNotes.push(frequency * 1.5);   // Perfect fifth up
      if (frequency * 4 < 1000) {          // Two octaves up (if not too high)
        melodyNotes.push(frequency * 4);
      }
    });

    // Add some passing tones that work with Western harmony
    const rootFreq = chord[0]; // Base frequency of chord

    // Add major scale intervals from the root
    melodyNotes.push(rootFreq * 1.125);  // Major second
    melodyNotes.push(rootFreq * 1.25);   // Major third
    melodyNotes.push(rootFreq * 1.5);    // Perfect fifth
    melodyNotes.push(rootFreq * 1.67);   // Minor sixth
    melodyNotes.push(rootFreq * 1.875);  // Major seventh

    // Add higher octave versions
    melodyNotes.push(rootFreq * 2.25);   // Major second (octave up)
    melodyNotes.push(rootFreq * 2.5);    // Major third (octave up)
    melodyNotes.push(rootFreq * 3);      // Perfect fifth (octave up)

    return melodyNotes.filter(freq => freq >= 200 && freq <= 1000); // Keep in reasonable range
  }

  playPolyrhythms(chord, duration, startTime) {
    const beatsPerMinute = 120;
    const secondsPerBeat = 60 / beatsPerMinute;

    // Add different polyrhythmic layers
    this.playTripletLayer(chord, duration, startTime, secondsPerBeat);
    this.playOffbeatLayer(chord, duration, startTime, secondsPerBeat);
    this.playSixteenthLayer(chord, duration, startTime, secondsPerBeat);
    this.playDrumLayer(duration, startTime, secondsPerBeat);
    this.playCymbalLayer(duration, startTime, secondsPerBeat);
  }

  playTripletLayer(chord, duration, startTime, secondsPerBeat) {
    // Play triplets (3 notes per beat) - creates 3:4 polyrhythm against main beat
    const tripletDuration = secondsPerBeat / 3;
    const totalTriplets = Math.floor(duration / tripletDuration);

    for (let i = 0; i < totalTriplets; i++) {
      // 40% chance to play each triplet note
      if (Math.random() < 0.4) {
        const noteStartTime = startTime + (i * tripletDuration);
        const chordNote = chord[i % chord.length];
        const tripletNote = chordNote * (1 + Math.random() * 0.5); // Vary the octave slightly

        this.playPolyrhythmNote(tripletNote, tripletDuration * 0.7, noteStartTime, 'triplet');
      }
    }
  }

  playOffbeatLayer(chord, duration, startTime, secondsPerBeat) {
    // Play on the off-beats (syncopation)
    const numBeats = Math.floor(duration / secondsPerBeat);

    for (let beat = 0; beat < numBeats; beat++) {
      // Play on the "and" of each beat (half-beat offset)
      if (Math.random() < 0.6) {
        const noteStartTime = startTime + (beat * secondsPerBeat) + (secondsPerBeat / 2);
        const chordNote = chord[(beat + 1) % chord.length];
        const offbeatNote = chordNote * 1.5; // Perfect fifth

        this.playPolyrhythmNote(offbeatNote, secondsPerBeat * 0.3, noteStartTime, 'offbeat');
      }
    }
  }

  playSixteenthLayer(chord, duration, startTime, secondsPerBeat) {
    // Sparse sixteenth note patterns (4 subdivisions per beat)
    const sixteenthDuration = secondsPerBeat / 4;
    const totalSixteenths = Math.floor(duration / sixteenthDuration);

    for (let i = 0; i < totalSixteenths; i++) {
      // Very sparse - only 15% chance per sixteenth note
      if (Math.random() < 0.15) {
        const noteStartTime = startTime + (i * sixteenthDuration);
        const chordNote = chord[Math.floor(Math.random() * chord.length)];
        const sixteenthNote = chordNote * 2; // One octave up

        this.playPolyrhythmNote(sixteenthNote, sixteenthDuration * 0.8, noteStartTime, 'sixteenth');
      }
    }
  }

  playPolyrhythmNote(frequency, duration, startTime, type) {
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    // Different timbres for different polyrhythmic layers
    switch (type) {
      case 'triplet':
        oscillator.type = 'triangle';
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(frequency * 1.5, startTime);
        filter.Q.setValueAtTime(3, startTime);
        break;
      case 'offbeat':
        oscillator.type = 'sawtooth';
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(frequency * 0.8, startTime);
        filter.Q.setValueAtTime(1, startTime);
        break;
      case 'sixteenth':
        oscillator.type = 'sine';
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(frequency * 2, startTime);
        filter.Q.setValueAtTime(2, startTime);
        break;
    }

    oscillator.frequency.setValueAtTime(frequency, startTime);

    // Very quiet volume for polyrhythmic elements
    const volume = this.musicVolume * 0.08;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  playDrumLayer(duration, startTime, secondsPerBeat) {
    const numBeats = Math.floor(duration / secondsPerBeat);

    for (let beat = 0; beat < numBeats; beat++) {
      const beatStartTime = startTime + (beat * secondsPerBeat);

      // Kick drum on beats 1 and 3 (60% chance)
      if (beat % 2 === 0 && Math.random() < 0.6) {
        this.playKickDrum(beatStartTime);
      }

      // Snare drum on beats 2 and 4 (70% chance)
      if (beat % 2 === 1 && Math.random() < 0.7) {
        this.playSnare(beatStartTime);
      }

      // Hi-hat subdivisions (every eighth note, 40% chance)
      for (let eighth = 0; eighth < 2; eighth++) {
        const eighthTime = beatStartTime + (eighth * secondsPerBeat / 2);
        if (Math.random() < 0.4) {
          this.playHiHat(eighthTime);
        }
      }
    }
  }

  playCymbalLayer(duration, startTime, secondsPerBeat) {
    const numBeats = Math.floor(duration / secondsPerBeat);

    for (let beat = 0; beat < numBeats; beat++) {
      // Crash cymbal occasionally on beat 1 (20% chance)
      if (beat === 0 && Math.random() < 0.2) {
        this.playCrashCymbal(startTime + (beat * secondsPerBeat));
      }

      // Ride cymbal patterns (30% chance per beat)
      if (Math.random() < 0.3) {
        this.playRideCymbal(startTime + (beat * secondsPerBeat));
      }
    }
  }

  playKickDrum(startTime) {
    // Low-frequency thump
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(60, startTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, startTime);
    filter.Q.setValueAtTime(1, startTime);

    const volume = this.musicVolume * 0.15;
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.2);
  }

  playSnare(startTime) {
    // Sharp crack with noise
    const bufferSize = this.context.sampleRate * 0.1;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate noise burst
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.exp(-t * 40);
      output[i] = (Math.random() * 2 - 1) * envelope;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(300, startTime);
    filter.Q.setValueAtTime(1, startTime);

    const volume = this.musicVolume * 0.12;
    gainNode.gain.setValueAtTime(volume, startTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);

    source.start(startTime);
  }

  playHiHat(startTime) {
    // High-frequency metallic sound
    const bufferSize = this.context.sampleRate * 0.05;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate metallic noise
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.exp(-t * 60);
      output[i] = (Math.random() * 2 - 1) * envelope * 0.5;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, startTime);
    filter.Q.setValueAtTime(2, startTime);

    const volume = this.musicVolume * 0.08;
    gainNode.gain.setValueAtTime(volume, startTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);

    source.start(startTime);
  }

  playCrashCymbal(startTime) {
    // Sustained metallic crash
    const bufferSize = this.context.sampleRate * 0.8;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = buffer.getChannelData(0);

    // Generate sustained metallic noise
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.exp(-t * 3);
      output[i] = (Math.random() * 2 - 1) * envelope * 0.3;
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gainNode = this.context.createGain();

    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(5000, startTime);
    filter.Q.setValueAtTime(0.5, startTime);

    const volume = this.musicVolume * 0.1;
    gainNode.gain.setValueAtTime(volume, startTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);

    source.start(startTime);
  }

  playRideCymbal(startTime) {
    // Metallic ping with sustain
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(3000, startTime);
    oscillator.frequency.linearRampToValueAtTime(2500, startTime + 0.3);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(4000, startTime);
    filter.Q.setValueAtTime(3, startTime);

    const volume = this.musicVolume * 0.06;
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.4);
  }

  playMelodyNote(frequency, duration, startTime) {
    // Create harmonica-like melody sound
    const fundamental = this.context.createOscillator();
    const harmonics = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gainNode = this.context.createGain();
    const vibratoOsc = this.context.createOscillator();
    const vibratoGain = this.context.createGain();

    // Main harmonica sound
    fundamental.type = 'sawtooth';
    fundamental.frequency.setValueAtTime(frequency, startTime);

    // Add harmonics
    harmonics.type = 'triangle';
    harmonics.frequency.setValueAtTime(frequency * 2, startTime);

    // Subtle vibrato
    vibratoOsc.type = 'sine';
    vibratoOsc.frequency.setValueAtTime(5, startTime); // 5Hz vibrato
    vibratoGain.gain.setValueAtTime(frequency * 0.01, startTime); // 1% vibrato depth

    vibratoOsc.connect(vibratoGain);
    vibratoGain.connect(fundamental.frequency);

    // Harmonica-like filter
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(frequency * 1.5, startTime);
    filter.Q.setValueAtTime(2, startTime);

    // Mix and connect
    const harmonicsGain = this.context.createGain();
    harmonicsGain.gain.setValueAtTime(0.3, startTime);

    fundamental.connect(filter);
    harmonics.connect(harmonicsGain);
    harmonicsGain.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.musicGain);

    // Gentle melody envelope (louder than chords but still subtle)
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.15, startTime + 0.1);
    gainNode.gain.setValueAtTime(this.musicVolume * 0.12, startTime + duration * 0.8);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    // Start all oscillators
    fundamental.start(startTime);
    harmonics.start(startTime);
    vibratoOsc.start(startTime);

    // Stop all oscillators
    fundamental.stop(startTime + duration);
    harmonics.stop(startTime + duration);
    vibratoOsc.stop(startTime + duration);
  }

  stopCurrentMusic() {
    // Stop the actual audio source if it exists
    if (this.currentMusicSource) {
      try {
        console.log('Stopping current music to prevent overlap');
        this.currentMusicSource.stop();
      } catch (e) {
        // Audio source might already be stopped
        console.log('Audio source already stopped');
      }
      this.currentMusicSource = null;
    }
    this.currentMusic = null;
  }

  playNextTrackManual() {
    if (!this.musicFiles || this.musicFiles.length === 0) return;

    // Stop any current music immediately
    this.stopCurrentMusic();

    // Move to next track
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicFiles.length;

    // Ensure we have the correct music setup
    this.currentMusic = { melody: 'audio_files', type: 'background', startTime: this.context ? this.context.currentTime : 0 };

    // Play next audio track directly - no synthesized music!
    this.playNextAudioTrack();
  }

  playPreviousTrack() {
    if (!this.musicFiles || this.musicFiles.length === 0) return;

    this.currentTrackIndex = this.currentTrackIndex - 1;
    if (this.currentTrackIndex < 0) {
      this.currentTrackIndex = this.musicFiles.length - 1;
    }
    this.stopCurrentMusic();
    this.startBackgroundMusic();
  }

  toggleMusicPause() {
    if (this.isMusicPaused) {
      // Resume music
      this.startBackgroundMusic();
      this.isMusicPaused = false;
    } else {
      // Pause music
      this.stopCurrentMusic();
      this.isMusicPaused = true;
    }
  }

  getCurrentTrackInfo() {
    if (!this.musicFiles || this.musicFiles.length === 0) {
      return { name: 'No tracks loaded', index: 0, total: 0 };
    }

    const currentFile = this.musicFiles[this.currentTrackIndex];
    const trackName = currentFile ? currentFile.replace(/^.*\//, '').replace(/\.[^/.]+$/, '') : 'Unknown';

    return {
      name: trackName,
      index: this.currentTrackIndex + 1,
      total: this.musicFiles.length,
      isPaused: this.isMusicPaused || false
    };
  }

  // Volume controls
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  mute() {
    this.isMuted = true;
    if (this.masterGain) {
      this.masterGain.gain.value = 0;
    }
  }

  unmute() {
    this.isMuted = false;
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return !this.isMuted;
  }

  /**
   * Play a voice audio file (separate from background music)
   * @param {string} voiceFile - Path to the voice audio file
   * @param {number} volume - Volume level (0-1)
   * @param {number} delay - Delay in seconds before playing
   * @returns {Promise} Resolves when voice starts playing
   */
  async playVoiceAudio(voiceFile, volume = 0.8, delay = 0) {
    // Initialize audio if needed
    if (!this.isInitialized) {
      await this.initializeAudio();
    }

    if (!this.isInitialized || !this.context) {
      console.warn('Audio context not initialized for voice playback');
      return;
    }

    // Don't play if muted
    if (this.isMuted) {
      console.log('Voice audio skipped - audio is muted');
      return;
    }

    try {
      await this.resumeContext();

      // Fetch and decode the voice audio file
      const response = await fetch(voiceFile);
      if (!response.ok) {
        throw new Error(`Failed to fetch voice file ${voiceFile}: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      console.log(`Voice loaded: ${voiceFile}, duration: ${audioBuffer.duration}s`);

      // Create source for voice audio
      const source = this.context.createBufferSource();
      source.buffer = audioBuffer;

      // Create a separate gain node for voice (independent of music)
      const voiceGain = this.context.createGain();
      voiceGain.gain.value = volume * this.voiceVolume * this.masterVolume;

      // Connect voice directly to master gain (parallel to music)
      source.connect(voiceGain);
      voiceGain.connect(this.masterGain);

      // Reduce music volume during voice playback
      this.reduceMusicVolume();

      // Start playing after delay
      const startTime = this.context.currentTime + delay;
      source.start(startTime);

      // Store reference for potential stopping
      this.currentVoiceSource = source;

      // Restore music volume when voice ends
      const voiceDuration = audioBuffer.duration;
      setTimeout(() => {
        this.restoreMusicVolume();
        this.currentVoiceSource = null;
      }, (delay + voiceDuration) * 1000);

      // Clear reference when done
      source.onended = () => {
        this.currentVoiceSource = null;
        console.log('Voice audio finished playing');
      };

      console.log(`Voice audio "${voiceFile}" scheduled to play in ${delay} seconds`);

    } catch (error) {
      console.error('Error playing voice audio:', error);
    }
  }

  /**
   * Stop current voice audio if playing
   */
  stopVoiceAudio() {
    if (this.currentVoiceSource) {
      try {
        this.currentVoiceSource.stop();
        this.currentVoiceSource = null;
        console.log('Voice audio stopped');
      } catch (error) {
        // Source may have already stopped
      }
    }
  }

  /**
   * Temporarily reduce music volume for voice playback
   */
  reduceMusicVolume() {
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.musicVolumeReduced * this.masterVolume, this.context.currentTime);
      console.log('Music volume reduced for voice playback');
    }
  }

  /**
   * Restore music volume after voice playback
   */
  restoreMusicVolume() {
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(this.musicVolume * this.masterVolume, this.context.currentTime);
      console.log('Music volume restored after voice playback');
    }
  }
}

export default AudioManager;