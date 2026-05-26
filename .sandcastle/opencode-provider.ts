import type {
  AgentProvider,
  AgentCommandOptions,
  PrintCommand,
  ParsedStreamEvent,
  IterationUsage,
} from "@ai-hero/sandcastle";

export interface CustomOpenCodeOptions {
  readonly variant?: string;
  readonly env?: Record<string, string>;
}

/**
 * Custom opencode provider for sandcastle.
 *
 * Fixes the built-in `opencode()` provider by:
 * - Passing prompt via stdin (avoids argv length limits)
 * - Using `--format json` for structured streaming output
 * - Using `--dangerously-skip-permissions` for headless operation
 * - Implementing `parseStreamLine` to handle opencode's NDJSON format
 */
export const customOpenCode = (
  model: string,
  options?: CustomOpenCodeOptions,
): AgentProvider => ({
  name: "opencode",
  env: options?.env ?? {},
  captureSessions: false,

  buildPrintCommand({
    prompt,
    dangerouslySkipPermissions,
  }: AgentCommandOptions): PrintCommand {
    const skipPerms = dangerouslySkipPermissions
      ? " --dangerously-skip-permissions"
      : "";
    const variantFlag = options?.variant
      ? ` --variant ${options.variant}`
      : "";
    return {
      command: `opencode run --format json${skipPerms} --model ${model}${variantFlag} -`,
      stdin: prompt,
    };
  },

  buildInteractiveArgs({ prompt }: AgentCommandOptions): string[] {
    const args = ["opencode", "--model", model];
    if (prompt) args.push("-p", prompt);
    return args;
  },

  parseStreamLine(line: string): ParsedStreamEvent[] {
    if (!line.startsWith("{")) return [];
    try {
      const obj = JSON.parse(line);
      const type = obj.type;

      if (type === "text") {
        const text = obj.part?.text;
        if (typeof text === "string" && text.length > 0) {
          return [{ type: "text", text }];
        }
        return [];
      }

      if (type === "result") {
        const result = obj.result ?? obj.part?.text;
        if (typeof result === "string" && result.length > 0) {
          return [{ type: "result", result }];
        }
        return [];
      }

      if (type === "tool_call") {
        const name = obj.name ?? obj.part?.name;
        const args = obj.args ?? obj.part?.args;
        if (typeof name === "string" && typeof args === "string") {
          return [{ type: "tool_call", name, args }];
        }
        return [];
      }

      if (type === "error") {
        const msg =
          typeof obj.error === "string"
            ? obj.error
            : obj.error?.message ?? obj.message;
        if (typeof msg === "string") {
          return [{ type: "result", result: msg }];
        }
        return [];
      }
    } catch {
      // Not valid JSON — skip
    }
    return [];
  },

  parseSessionUsage(_content: string): IterationUsage | undefined {
    return undefined;
  },
});
