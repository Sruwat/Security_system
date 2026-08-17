import React from 'react';

export function useTimedTapTrigger(props: {
  key: string;
  tapCountRequired?: number;
  windowMs?: number;
  debounceMs?: number;
  onTrigger: () => void | Promise<void>;
}) {
  const tapCountRequired = props.tapCountRequired ?? 3;
  const windowMs = props.windowMs ?? 1400;
  const debounceMs = props.debounceMs ?? 800;
  const stateRef = React.useRef({lastTapAt: 0, count: 0, lastTriggerAt: 0});

  return React.useCallback(() => {
    const now = Date.now();
    const state = stateRef.current;

    if (now - state.lastTriggerAt < debounceMs) {
      return;
    }

    if (now - state.lastTapAt > windowMs) {
      state.count = 1;
    } else {
      state.count += 1;
    }
    state.lastTapAt = now;

    if (state.count >= tapCountRequired) {
      state.count = 0;
      state.lastTriggerAt = now;
      void props.onTrigger();
    }
  }, [debounceMs, props, tapCountRequired, windowMs]);
}
