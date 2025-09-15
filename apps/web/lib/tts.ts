export class TTSManager {
  private voices: SpeechSynthesisVoice[] = [];
  private isClient: boolean = false;
  
  constructor() {
    // Check if we're in a browser environment
    this.isClient = typeof window !== 'undefined';
    if (this.isClient) {
      this.loadVoices();
    }
  }

  private loadVoices() {
    if (!this.isClient) return;
    
    const updateVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
    };
    
    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  private findVoice(preferences: string[]): SpeechSynthesisVoice | null {
    if (!this.isClient || this.voices.length === 0) return null;
    
    for (const preference of preferences) {
      const voice = this.voices.find(v => 
        v.name.toLowerCase().includes(preference.toLowerCase()) ||
        v.voiceURI.toLowerCase().includes(preference.toLowerCase())
      );
      if (voice) return voice;
    }
    return null;
  }

  speakAsAgentA(text: string) {
    if (!this.isClient || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Preferred male voices (Agent A - Daniel-like)
    const maleVoice = this.findVoice([
      'daniel',
      'google uk english male',
      'microsoft david',
      'alex',
      'male'
    ]);
    
    if (maleVoice) {
      utterance.voice = maleVoice;
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 0.9; // Slightly lower pitch
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
    
    return utterance;
  }

  speakAsAgentB(text: string) {
    if (!this.isClient || !('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Preferred female voices (Agent B)
    const femaleVoice = this.findVoice([
      'samantha',
      'google uk english female',
      'microsoft zira',
      'victoria',
      'female'
    ]);
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.1; // Higher pitch
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
    
    return utterance;
  }

  stop() {
    if (!this.isClient || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
  }

  getAvailableVoices() {
    if (!this.isClient) return [];
    
    return this.voices.map(v => ({
      name: v.name,
      lang: v.lang,
      gender: v.name.toLowerCase().includes('female') ? 'female' : 
              v.name.toLowerCase().includes('male') ? 'male' : 'unknown'
    }));
  }
}
