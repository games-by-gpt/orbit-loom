# Trial: making and publishing an original game

## 2026-11-03 — Start

- The user authorized an original game, public publication on Arcadible as `@gpt`, and source hosting in the GitHub organization `games-by-gpt`.
- The workspace was empty. No applicable `AGENTS.md` was present in the workspace or its parents.
- Confirmed that the provided Arcadible, AgentMail, and GitHub credential environment variables exist. Their values will not be written to source, logs, or this document.
- Found Arcadible's developer documentation and its CLI-based publishing workflow. The web browsing tool could not open the homepage; normal HTTPS requests worked, so I used those to read the official documentation.
- Assumption: I may choose the game concept, visual style, controls, title, license, and repository name. I will make a self-contained browser game with keyboard and touch support, original procedural art, and no required external assets.

## Working concept

**Orbit Loom**: a timing and route-planning arcade game in which a tiny shuttle travels around circular looms. Swap between adjoining rings at their junctions to collect a constellation of threads, then reach the exit. The art direction is a luminous mechanical star atlas: ink blue, warm ivory, teal, and coral. Levels will introduce timing, direction changes, and moving hazards with short, replayable runs.

- This is a new concept and implementation for this task; the title's availability has not yet been checked.
- I will keep the build dependency-free at runtime, draw the art in Canvas, and use a small Node build script. This is a design choice, not a user requirement.

## Implementation and account access

- Installed the official `arcadible` CLI and read the official manifest, runtime, saves, store-page, and deployment documentation.
- Logged in through Arcadible's documented device-code browser flow using the supplied credentials. The first attempt saved the browser session before the redirect finished; repeating the flow with the device code first completed successfully. No email verification was requested, so AgentMail access was unnecessary.
- Installed Playwright and Chromium for browser testing. Chromium initially failed because shared system libraries were absent; installed its required Linux libraries and retried successfully.
- Built a Canvas 2D game from scratch: nine authored constellation layouts, deterministic ring/junction simulation, three collectibles per ring, queued switching, direction reversal, moving coral hazards, three lives per stage, an exit that opens after collection, medals, replay, and an atlas of unlocked levels.
- Added responsive HTML controls, keyboard navigation, synthesized sound, reduced-motion behavior, pause on blur/hidden tabs, and Arcadible SDK saves. The SDK is the only runtime package; esbuild bundles it locally with the game. This revises the initial plan for zero runtime dependencies so progress survives Arcadible version updates.
- Assumptions: a nine-stage campaign is an appropriate complete scope; gentle first stages and optional speed medals fit the concept better than a mandatory countdown. Chose `everyone` audience and `generative` AI disclosure because the text, level designs, and procedural artwork are generated as part of this task.
- Set the requested visibility to `public`. The initial version is a prerelease for staging validation; a stable version will be deployed for public release after testing.

## Testing and store preparation

- Added seven simulation tests covering connected level graphs, collectible placement, junction transfers in both directions, cancellation, collection/exit rules, damage grace periods, medals, and control-only winning replays for all nine levels.
- A route planner completed all nine levels with hazards active and zero hits. Recorded its switch/reverse inputs as regression fixtures; the replay test does not teleport the shuttle, remove hazards, or alter collectibles.
- Tested the actual browser UI in Chromium. Initial fixed-time browser replay attempts drifted from the simulation because the browser clock continued during automation; paused the test clock and switched the browser test to a pilot that reads a diagnostic snapshot and sends keyboard events through the real game handlers. This was a test-harness timing issue, not evidence that the game could not be completed.
- Inspected desktop and portrait phone screenshots. Added a compact side-control layout for short landscape screens. Tests also cover pause, restart, saving/reloading unlocked stages, mouse controls, and touch controls.
- Created original store art with a reproducible SVG composition script and rasterized it to PNG. Used code-native circles, stars, and typography to match the game, rather than external media. Adjusted subjects to respect Arcadible's 10% safe margins.
- Arcadible validation rejected the initial tagline for exceeding 30 characters. Replaced it with **Weave a little infinity.** Validation then passed with no issues or warnings.
- Verified that `https://arcadible.com/@gpt` exists and that the `orbit-loom` game URL was not already in use before deployment.
- Assumptions: the GitHub repository should also be public to accompany the public game; the MIT license is suitable for this original source and art. The user did not specify a license.
- Verification limits: browser tests use Chromium and emulated touch viewports, not physical phones or every browser engine. The synthesized audio is exercised by the browser, but this environment does not provide a human listening test.

## Release preparation

- Staging `1.0.0-beta.1` published successfully at `https://play.arcadible.com/orbit-loom:staging/` (release `a087ae4f-cbfd-45fe-8c17-0c41c43c8a3e`). Opened it without an account and verified the game loaded in Arcadible's iframe, started, accepted controls, paused, and reported no JavaScript errors.
- The complete browser suite passed all nine stages, save/reload persistence, the fully unlocked atlas, pause freezing the simulation, restart, mouse switching/reversal, viewport overflow checks, and touch navigation. The browser pilot took one hit on stage eight and still won; the independent fixed-step replay fixtures demonstrate zero-hit routes for all nine. Completion, not perfection by an automated pilot, is the browser acceptance condition.
- Captured three desktop and three phone gameplay images for the store, from actual running game states. Gallery filenames and dimensions follow Arcadible's requirements.
- Chose stable release version `1.0.0`. The game UUID is `607ba177-7a6e-4105-92e9-9ec85a44d72c`; it will remain fixed across future versions.
- Created the public repository `https://github.com/games-by-gpt/orbit-loom`, added a build/test workflow, and set its homepage to the Arcadible listing.
- Checked source files for the supplied credential values: none found. Authentication state and browser session files are outside the repository. Added generated Arcadible package caches to `.gitignore`.
- Final local simulation tests: 7 passed. Final Arcadible manifest/store-art validation: no issues and no warnings.

## Production publication and GitHub permissions

- Arcadible production release `1.0.0` published successfully with no warnings (release `811a9b2c-e478-4794-9fd6-df0d5fc35685`, build `63817b42-9033-49cd-9eb2-03f09dfd6c11`).
- Store: `https://arcadible.com/play/orbit-loom`.
- Direct play: `https://play.arcadible.com/orbit-loom/`.
- The first Git push had no credential helper configured; configured Git to use GitHub CLI's environment-backed authentication.
- The next push was rejected because the supplied token lacks GitHub's `workflow` scope. Removed the optional CI workflow from the unpublished initial commit and retained the local test/build scripts. No broader token permissions were requested or assumed. This does not affect publishing the game's source or the already completed checks.
