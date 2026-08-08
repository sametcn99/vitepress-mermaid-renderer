# Changelog

## 1.2.0

### Changed in 1.2.0

- Stabilized features introduced in previous releases for a more reliable
  interactive diagram experience.
- Interactive diagrams now always fit and center themselves after rendering,
  theme updates, and Reset View actions.
- Removed the `fitToContainer` option and its runtime update event; automatic
  fitting is now the standard interactive behavior.
- Updated the English, Turkish, and Chinese documentation to describe automatic
  fitting without a separate configuration option.

### Fixed in 1.2.0

- Restored the container-centered transform origin required by the fitting
  calculation, fixing diagrams that were incorrectly scaled or positioned in
  1.1.32.
- Fixed sluggish diagram dragging by accounting for the fitted base scale,
  removing mousemove frame throttling, and stopping zoom transitions when a drag
  begins.
