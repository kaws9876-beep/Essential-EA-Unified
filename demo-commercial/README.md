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

## C3 Synthetic Lifecycle

After human approval, the selected path produces an in-memory governed plan. A presenter initiates simulation, advances each action, receives labeled synthetic artifacts, and invokes a separate independent verification step. Only fully verified actions create a modeled outcome and retained memory record. The optional blocked-dependency path fails closed. Reset discards the scenario state deterministically. No operation contacts or changes an external system; modeled value is not recognized revenue.

## C1 Foundation

C1 established the shell, deterministic fixture state, lifecycle rail, initial opportunity overview, reset behavior, and deny-by-default simulated execution adapter. C3 extends only the isolated demonstration while preserving this safety contract.

## Local Static Preview

From the repository root, serve the directory with any static file server, for example:

```bash
npx http-server demo-commercial
```

Do not add live integration calls to this directory.
