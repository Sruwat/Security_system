import type {SessionState} from '../../types/domain';

class SessionManager {
  private current: SessionState | null = null;

  getState(): SessionState | null {
    return this.current;
  }

  startSession(packageName: string, durationSeconds: number, vaultUnlocked = false): SessionState {
    const now = Date.now();
    this.current = {
      packageName,
      vaultUnlocked,
      expiresAt: now + durationSeconds * 1000,
    };
    return this.current;
  }

  startVaultSession(durationSeconds: number): SessionState {
    const now = Date.now();
    this.current = {
      vaultUnlocked: true,
      expiresAt: now + durationSeconds * 1000,
    };
    return this.current;
  }

  isValidFor(packageName?: string): boolean {
    if (!this.current) {
      return false;
    }

    const notExpired = this.current.expiresAt > Date.now();
    if (this.current.vaultUnlocked && notExpired) {
      return true;
    }
    const packageMatches = packageName ? this.current.packageName === packageName : true;
    return notExpired && packageMatches;
  }

  clear(): void {
    this.current = null;
  }
}

export const sessionManager = new SessionManager();
