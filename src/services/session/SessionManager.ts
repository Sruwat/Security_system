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
    if (!notExpired) {
      return false;
    }

    if (!packageName) {
      return this.current.vaultUnlocked;
    }

    return this.current.packageName === packageName;
  }

  isVaultUnlocked(): boolean {
    return Boolean(this.current?.vaultUnlocked) && Boolean(this.current && this.current.expiresAt > Date.now());
  }

  clear(): void {
    this.current = null;
  }
}

export const sessionManager = new SessionManager();
