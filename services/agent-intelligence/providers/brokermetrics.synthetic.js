import { AgentIntelligenceProvider, providerEnvelope } from './base.js';
import { AGENT_SIGNAL_TYPES, assertAgentSignal } from '../domain.js';

// Development-only adapter. It proves the BrokerMetrics boundary without
// coupling STORM to undocumented/private APIs or licensed production data.
export class SyntheticBrokerMetricsAdapter extends AgentIntelligenceProvider {
  constructor({ tenantId = 'legacy-pilot' } = {}) {
    super('brokermetrics-synthetic');
    this.tenantId = tenantId;
  }

  async capabilities() {
    return {
      readAgents: true,
      readSignals: true,
      writeBack: false,
      synthetic: true,
      signalTypes: [
        AGENT_SIGNAL_TYPES.PRODUCTION_VOLUME_CHANGE,
        AGENT_SIGNAL_TYPES.PRODUCTION_TRANSACTION_CHANGE,
        AGENT_SIGNAL_TYPES.PRODUCTION_LISTING_CHANGE,
        AGENT_SIGNAL_TYPES.MARKET_OFFICE_CHANGE,
        AGENT_SIGNAL_TYPES.MARKET_SHARE_CHANGE,
        AGENT_SIGNAL_TYPES.GEOGRAPHY_RADIUS_MATCH
      ]
    };
  }

  async syncAgents() {
    return providerEnvelope(this.provider, [
      {
        provider: this.provider,
        externalId: 'bm-demo-001',
        displayName: 'Synthetic Agent 001',
        currentBrokerage: 'Example Brokerage',
        geography: { county: 'Bexar', state: 'TX' },
        productionSummary: {
          period: 'trailing_12_months',
          volume: 8200000,
          transactions: 17
        }
      }
    ]);
  }

  async syncSignals() {
    const now = new Date().toISOString();
    const signal = assertAgentSignal({
      id: 'signal-bm-demo-volume-001',
      tenantId: this.tenantId,
      agentId: 'agent-demo-001',
      signalType: AGENT_SIGNAL_TYPES.PRODUCTION_VOLUME_CHANGE,
      sourceProvider: this.provider,
      sourceRecordId: 'bm-demo-001',
      observedAt: now,
      ingestedAt: now,
      evidence: {
        period: 'trailing_90_days_vs_prior_90_days',
        percentChange: 24,
        note: 'Synthetic evidence for integration testing only'
      },
      confidence: 1,
      direction: 'up'
    });
    return providerEnvelope(this.provider, [signal]);
  }

  async health() {
    return { provider: this.provider, ok: true, mode: 'synthetic' };
  }
}
