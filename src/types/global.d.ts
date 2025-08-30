// Global type definitions
declare global {
  var console: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    info: (...args: any[]) => void;
  };

  var process: {
    env: NodeJS.ProcessEnv;
    exit: (code?: number) => never;
    on: (event: string, listener: (...args: any[]) => void) => void;
    uptime: () => number;
  };
}

export { };
