import {sessionManager} from '../src/services/session/SessionManager';

describe('SessionManager', () => {
  afterEach(() => {
    sessionManager.clear();
  });

  it('starts and validates a session', () => {
    sessionManager.startSession('com.example.app', 60);
    expect(sessionManager.isValidFor('com.example.app')).toBe(true);
  });

  it('rejects an expired session', () => {
    sessionManager.startSession('com.example.app', 0);
    expect(sessionManager.isValidFor('com.example.app')).toBe(false);
  });

  it('rejects the wrong package', () => {
    sessionManager.startSession('com.example.app', 60);
    expect(sessionManager.isValidFor('com.other.app')).toBe(false);
  });
});
