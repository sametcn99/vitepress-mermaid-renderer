type Command = string[];

interface CommandOptions {
  cwd?: string;
  allowFailure?: boolean;
}

class Logger {
  private readonly colors: {
    green: string;
    gray: string;
    red: string;
    reset: string;
  };

  constructor(private readonly isTTY = Boolean(process.stdout.isTTY)) {
    const apply = (code: string) => (this.isTTY ? code : "");
    this.colors = {
      green: apply("\u001B[32m"),
      gray: apply("\u001B[90m"),
      red: apply("\u001B[31m"),
      reset: apply("\u001B[0m"),
    };
  }

  step(message: string, subtitle?: string) {
    console.log(`\n${this.colors.green}${message}${this.colors.reset}`);
    if (subtitle) {
      console.log(`${this.colors.gray}${subtitle}${this.colors.reset}`);
    }
  }

  subStep(message: string) {
    console.log(`  - ${this.colors.gray}${message}${this.colors.reset}`);
  }

  error(message: string) {
    console.error(`\n${this.colors.red}${message}${this.colors.reset}`);
  }
}

class CommandRunner {
  async run(command: Command, options: CommandOptions = {}) {
    const [cmd, ...args] = command;
    const proc = Bun.spawn([cmd, ...args], {
      cwd: options.cwd,
      stdout: "inherit",
      stderr: "inherit",
      stdin: "inherit",
    });

    const exitCode = await proc.exited;
    if (exitCode !== 0 && !options.allowFailure) {
      throw new Error(
        `Command "${command.join(" ")}" failed with exit code ${exitCode}`,
      );
    }

    return exitCode;
  }
}

class FileManager {
  constructor(private readonly logger: Logger) {}

  async pathExists(path: string) {
    try {
      await Bun.file(path).stat();
      return true;
    } catch {
      return false;
    }
  }

  async removeSafeItem(path: string, message: string) {
    if (await this.pathExists(path)) {
      this.logger.subStep(message);
      await this.remove(path);
    }
  }

  async remove(path: string) {
    const stats = await Bun.file(path)
      .stat()
      .catch(() => null);

    if (!stats) {
      return;
    }

    if (!stats.isDirectory()) {
      await Bun.file(path).delete();
      return;
    }

    const command =
      process.platform === "win32"
        ? ["cmd", "/c", "rmdir", "/s", "/q", path]
        : ["rm", "-rf", path];

    const proc = Bun.spawn(command, {
      stdout: "inherit",
      stderr: "inherit",
      stdin: "inherit",
    });
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      throw new Error(`Failed to remove directory: ${path}`);
    }
  }

  async listMatching(pattern: string, cwd = process.cwd()) {
    const glob = new Bun.Glob(pattern);
    const matches: string[] = [];
    for await (const match of glob.scan({ cwd })) {
      matches.push(match);
    }
    return matches;
  }
}

class PackageManager {
  private constructor(private readonly runner: CommandRunner) {}

  static async create(runner: CommandRunner) {
    const bunPath = await Bun.which("bun");
    if (!bunPath) {
      throw new Error("Bun is not available on PATH. Install Bun to continue.");
    }

    return new PackageManager(runner);
  }

  async runScript(script: string, scriptArgs: string[] = []) {
    await this.runner.run(["bun", "run", script, ...scriptArgs]);
  }

  async installDependencies() {
    await this.runner.run(["bun", "install"]);
  }

  async removePackage(pkg: string) {
    await this.runner.run(["bun", "remove", pkg], { allowFailure: true });
  }

  async installLocalPackage(packagePath: string) {
    await this.runner.run(["bun", "add", packagePath]);
  }

  async createPackageArchive() {
    await this.runner.run(["bun", "pm", "pack"]);
  }
}

class TestWorkflow {
  constructor(
    private readonly rootDir: string,
    private readonly logger: Logger,
    private readonly fileManager: FileManager,
    private readonly packageManager: PackageManager,
  ) {}

  async run() {
    await this.withDirectory(this.rootDir, async () => {
      await this.cleanArtifacts();
      await this.buildAndPack();
      await this.setupTestProject();
    });
  }

  private async cleanArtifacts() {
    this.logger.step("Cleaning previous build artifacts");

    const archives = await this.fileManager.listMatching("*.tgz", this.rootDir);
    for (const archive of archives) {
      this.logger.subStep(`Removing package: ${archive}`);
      await this.fileManager.remove(archive);
    }

    await this.fileManager.removeSafeItem("dist", "Removing dist directory");
  }

  private async buildAndPack() {
    this.logger.step("Building the package");
    await this.packageManager.runScript("build");

    this.logger.step("Creating package archive");
    await this.packageManager.createPackageArchive();
  }

  private async setupTestProject() {
    this.logger.step(
      "Setting up test environment",
      "Switching to test-project directory",
    );

    await this.withDirectory(
      this.resolvePath(this.rootDir, "test-project"),
      async () => {
        await this.fileManager.removeSafeItem(
          ".vitepress/cache",
          "Cleaning VitePress cache",
        );
        await this.fileManager.removeSafeItem(
          "dist",
          "Cleaning dist directory",
        );
        await this.fileManager.removeSafeItem(
          "node_modules",
          "Cleaning node_modules",
        );

        this.logger.subStep("Removing existing package");
        await this.packageManager.removePackage("vitepress-mermaid-renderer");

        this.logger.step("Installing dependencies");
        await this.packageManager.installDependencies();

        this.logger.subStep("Installing local package");
        const packageFile = await this.findPackageArchive();
        if (!packageFile) {
          throw new Error("No package archive found in parent directory.");
        }
        await this.packageManager.installLocalPackage(packageFile);

        this.logger.step("Building documentation");
        await this.packageManager.runScript("docs:build");

        this.logger.step(
          "Previewing production build",
          "Press Ctrl+C to stop the preview when ready. Use your PC LAN IP from mobile.",
        );
        await this.packageManager.runScript("docs:preview", [
          "--",
          "--host",
          "0.0.0.0",
        ]);
      },
    );
  }

  private async findPackageArchive() {
    const archives = await this.fileManager.listMatching("*.tgz", this.rootDir);
    const archive = archives[0];
    return archive ? this.resolvePath(this.rootDir, archive) : null;
  }

  private async withDirectory<T>(
    directory: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    const previousCwd = process.cwd();
    process.chdir(directory);
    try {
      return await callback();
    } finally {
      process.chdir(previousCwd);
    }
  }

  private resolvePath(base: string, child: string) {
    if (child.startsWith("/") || /^[A-Za-z]:/.test(child)) {
      return child;
    }
    const trimmedBase = base.replace(/[\\/]+$/, "");
    const trimmedChild = child.replace(/^[\\/]+/, "");
    const separator = process.platform === "win32" ? "\\" : "/";
    return `${trimmedBase}${separator}${trimmedChild}`;
  }
}

const logger = new Logger();

const main = async () => {
  const commandRunner = new CommandRunner();
  const packageManager = await PackageManager.create(commandRunner);
  const fileManager = new FileManager(logger);
  const rootDir = import.meta.dir;

  const workflow = new TestWorkflow(
    rootDir,
    logger,
    fileManager,
    packageManager,
  );

  await workflow.run();
};

main().catch((error) => {
  logger.error(
    `Error: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
