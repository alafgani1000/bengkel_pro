export {};

declare global {
  interface Window {
    api: {
      invoke(channel: 'migration:check'): Promise<{ success: boolean; pendingMigrations?: string[]; error?: string }>;
      invoke(channel: 'migration:run', pendingMigrations: string[]): Promise<{ success: boolean; error?: string }>;
      invoke(channel: string, ...args: any[]): Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
      platform: string;
    };
  }
}
