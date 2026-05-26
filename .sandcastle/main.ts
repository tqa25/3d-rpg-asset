import { run } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";
import { customOpenCode } from "./opencode-provider.js";
import { homedir } from "os";
import { join } from "path";

const model = process.env.OPENCODE_MODEL ?? "opencode/deepseek-v4-flash-free";
const hostHome = homedir();

await run({
  agent: customOpenCode(model, {
    variant: "high",
  }),
  sandbox: docker({
    imageName: "sandcastle:mmorpg",
    mounts: [
      {
        hostPath: join(hostHome, ".local/share/opencode/auth.json"),
        sandboxPath: "/home/agent/.local/share/opencode/auth.json",
        readonly: true,
      },
    ],
  }),
  promptFile: "./.sandcastle/prompt.md",
});
