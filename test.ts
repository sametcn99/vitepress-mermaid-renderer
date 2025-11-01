import { access, readdir, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

type Command = string[];

const isTTY = process.stdout.isTTY;
const colors = {
  green: isTTY ? "\u001B[32m" : "",
  gray: isTTY ? "\u001B[90m" : "",
  red: isTTY ? "\u001B[31m" : "",
  reset: isTTY ? "\u001B[0m" : "",
};

const logStep = (message: string, subtitle?: string) => {
  console.log(`\n${colors.green}${message}${colors.reset}`);
  if (subtitle) {
    console.log(`${colors.gray}${subtitle}${colors.reset}`);
  }
};

const logSubStep = (message: string) => {
  console.log(`  - ${colors.gray}${message}${colors.reset}`);
};

const pathExists = async (path: string) => {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const removeSafeItem = async (path: string, message: string) => {
  const target = resolve(path);
  if (await pathExists(target)) {
    logSubStep(message);
    await rm(target, { recursive: true, force: true });
  }
};

const spawnCommand = async (
  command: Command,
  {
    cwd,
    allowFailure = false,
  }: {
    cwd?: string;
    allowFailure?: boolean;
  } = {},
) => {
  const [cmd, ...args] = command;
  const proc = Bun.spawn([cmd, ...args], {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0 && !allowFailure) {
    throw new Error(
      `Command "${command.join(" ")}" failed with exit code ${exitCode}`,
    );
  }

  return exitCode;
};

const preferBun = async () => {
  const bunPath = await Bun.which("bun");
  const npmPath = await Bun.which("npm");

  if (!bunPath && !npmPath) {
    throw new Error(
      "Neither bun nor npm is available on PATH. Install Bun (recommended) or npm to continue.",
    );
  }

  return { hasBun: Boolean(bunPath), hasNpm: Boolean(npmPath) };
};

const runScript = async (script: string, hasBun: boolean) => {
  if (hasBun) {
    await spawnCommand(["bun", "run", script]);
  } else {
    await spawnCommand(["npm", "run", script]);
  }
};

const installDependencies = async (hasBun: boolean) => {
  if (hasBun) {
    await spawnCommand(["bun", "install"]);
  } else {
    await spawnCommand(["npm", "install"]);
  }
};

const removePackage = async (pkg: string, hasBun: boolean) => {
  if (hasBun) {
    await spawnCommand(["bun", "remove", pkg], { allowFailure: true });
  } else {
    await spawnCommand(["npm", "uninstall", pkg], { allowFailure: true });
  }
};

const installLocalPackage = async (
  packagePath: string,
  hasBun: boolean,
  hasNpm: boolean,
) => {
  if (hasBun) {
    await spawnCommand(["bun", "add", packagePath]);
  } else if (hasNpm) {
    await spawnCommand(["npm", "install", packagePath]);
  } else {
    throw new Error("No supported package manager available for installation.");
  }
};

const createPackageArchive = async (hasNpm: boolean) => {
  if (hasNpm) {
    await spawnCommand(["npm", "pack"]);
  } else {
    await spawnCommand(["bun", "pack"]);
  }
};

const cleanArtifacts = async (rootDir: string) => {
  logStep("Cleaning previous build artifacts");

  const entries = await readdir(rootDir);
  await Promise.all(
    entries
      .filter((entry) => entry.endsWith(".tgz"))
      .map(async (entry) => {
        logSubStep(`Removing package: ${entry}`);
        await rm(join(rootDir, entry), { force: true });
      }),
  );

  await removeSafeItem(join(rootDir, "dist"), "Removing dist directory");
};

const setupTestProject = async (
  testProjectDir: string,
  hasBun: boolean,
  hasNpm: boolean,
) => {
  logStep("Setting up test environment", "Switching to test-project directory");

  const previousCwd = process.cwd();
  process.chdir(testProjectDir);

  try {
    await removeSafeItem(".vitepress/cache", "Cleaning VitePress cache");
    await removeSafeItem("dist", "Cleaning dist directory");
    await removeSafeItem("node_modules", "Cleaning node_modules");

    logStep("Installing dependencies");
    await installDependencies(hasBun);

    logSubStep("Removing existing package");
    await removePackage("vitepress-mermaid-renderer", hasBun);

    logSubStep("Installing local package");
    const packageFile = await findPackageArchive();
    if (!packageFile) {
      throw new Error("No package archive found in parent directory.");
    }
    await installLocalPackage(packageFile, hasBun, hasNpm);

    logStep(
      "Starting development server",
      "Press Ctrl+C to stop the server when ready",
    );
    await runScript("docs:dev", hasBun);
  } finally {
    process.chdir(previousCwd);
  }
};

const findPackageArchive = async () => {
  const parentEntries = await readdir("..");
  const archive = parentEntries.find((entry) => entry.endsWith(".tgz"));
  return archive ? join("..", archive) : null;
};

const buildAndPack = async (hasBun: boolean, hasNpm: boolean) => {
  logStep("Building the package");
  await runScript("build", hasBun);

  logStep("Creating package archive");
  await createPackageArchive(hasNpm);
};

const main = async () => {
  const { hasBun, hasNpm } = await preferBun();

  const rootDir = dirname(fileURLToPath(new URL(import.meta.url)));
  process.chdir(rootDir);

  await cleanArtifacts(rootDir);
  await buildAndPack(hasBun, hasNpm);
  await setupTestProject(join(rootDir, "test-project"), hasBun, hasNpm);
};

main().catch((error) => {
  console.error(
    `\n${colors.red}Error: ${error instanceof Error ? error.message : error}${colors.reset}`,
  );
  process.exit(1);
});
