
export enum SessionState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING',
  AI_SPEAKING = 'AI_SPEAKING',
  ANALYZING = 'ANALYZING',
  ENDED = 'ENDED',
  ERROR = 'ERROR',
}

export interface TranscriptionEntry {
  speaker: 'user' | 'ai';
  text: string;
}

export interface NegotiationResult {
    score: number;
    feedback: string;
    xpGained: number;
    keyStrengths: string[];
    areasForImprovement: string[];
}

export interface NegotiationScale {
  announcementPosition: string;
  goal: string;
  worstCase: string;
  arguments: string[];
  tradeOffs: string[];
}

export interface NegotiationConfig {
  userRole: 'Buyer' | 'Seller';
  topic: string;
  userTarget: string;
  aiTarget: string;
  context: string;
  negotiationScale: NegotiationScale;
}

export interface UserProfile {
    xp: number;
    streak: number;
}

export type GameState = 'setup' | 'sim' | 'result';