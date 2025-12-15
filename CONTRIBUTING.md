# Contributing to VitePress Mermaid Renderer

First off, thanks for taking the time to contribute! 🎉

We appreciate all forms of contributions, whether it's reporting a bug, suggesting a new feature, or submitting a pull request to improve the code.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

- **Check existing issues** to see if the problem has already been reported.
- **Open a new issue** using the bug report template.
- Provide a clear and descriptive **title**.
- Describe the exact steps which reproduce the problem.
- Include screenshots or GIFs if possible.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

- **Check existing issues** to see if the feature has already been requested.
- **Open a new issue** using the feature request template.
- Use a clear and descriptive **title**.
- Provide a detailed description of the suggested enhancement.
- Explain why this enhancement would be useful to most users.

## Development Guide

### Prerequisites

This project uses [Bun](https://bun.sh) as the package manager and runtime. Please ensure you have it installed.

### Setup

1. Fork the repository on GitHub.
2. Clone your forked repository:
   ```bash
   git clone https://github.com/sametcn99/vitepress-mermaid-renderer.git
   cd vitepress-mermaid-renderer
   ```
3. Install dependencies:
   ```bash
   bun install
   ```

### Local Development

For testing changes locally, you can use the provided test helper script which cleans, builds, packs, and runs a test instance:

```bash
bun test.ts
```

Alternatively, you can manually build the project:

```bash
bun run build
```

### Style Guide

This project follows specific coding standards to ensure consistency.

- **Linting**: We use ESLint. Run the linter before pushing your changes:
  ```bash
  bun run lint
  ```
- **Formatting**: We use Prettier. Format your code using:
  ```bash
  bun run format
  ```

## Pull Request Process

1. Create a new branch for your feature or fix (`git checkout -b feature/amazing-feature`).
2. Make your changes and commit them with a descriptive commit message.
3. Ensure your code passes linting and formatting checks.
4. Push your branch to your fork (`git push origin feature/amazing-feature`).
5. Open a Pull Request against the `main` branch of the original repository.
6. Describe your changes detailedly in the PR description.

## License

By contributing, you agree that your contributions will be licensed under the [GPL-3.0 License](LICENSE).
