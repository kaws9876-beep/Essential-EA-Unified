# Essential EA + AI Storm OS Commercial Demo

This directory contains an isolated, static, synthetic Commercial demo shell.

## Safety

- Demo Mode - Synthetic Data is visible in the UI.
- No live systems connected.
- All actions are simulated.
- The demo does not use authentication.
- The demo does not use environment variables.
- The demo does not call production APIs or external networks.
- The demo does not write to live systems.
- All people and organizations in the fixture are fictional.

## Scenario

The synthetic scenario is Northstar Commercial Partners pursuing the Regional Portfolio Expansion opportunity. A fictional $1.8M value-at-risk engagement requires governed attention because signals are fragmented across communications, finance, scheduling, relationship systems, operations, and relationship history.

## C1 Scope

C1 establishes the shell, deterministic fixture state, lifecycle rail, initial opportunity overview, reset behavior, and deny-by-default simulated execution adapter. Later sprints can make the lifecycle stages interactive while preserving this safety contract.

## Local Static Preview

From the repository root, serve the directory with any static file server, for example:

```bash
npx http-server demo-commercial
```

Do not add live integration calls to this directory.
