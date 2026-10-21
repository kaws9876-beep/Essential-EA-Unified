// Provider boundary for EA STORM Agent Intelligence.
// Implementations must normalize source-specific records before they reach decision logic.

export class AgentIntelligenceProvider {
  constructor(provider) {
    if (!provider) throw new Error('provider name is required');
    this.provider = provider;
  }

  async capabilities() {
    throw new Error(`${this.provider}.capabilities() not implemented`);
  }

  async syncAgents(_cursor) {
    throw new Error(`${this.provider}.syncAgents() not implemented`);
  }

  async syncSignals(_cursor) {
    throw new Error(`${this.provider}.syncSignals() not implemented`);
  }

  async health() {
    throw new Error(`${this.provider}.health() not implemented`);
  }
}

export function providerEnvelope(provider, records, cursor = null) {
  return {
    provider,
    records,
    cursor,
    ingestedAt: new Date().toISOString()
  };
}
