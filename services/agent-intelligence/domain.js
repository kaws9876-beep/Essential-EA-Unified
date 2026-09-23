// EA STORM Agent Intelligence canonical domain model.
// Provider-neutral by design: BrokerMetrics, KW Command, MLS, Google Workspace,
// and future providers normalize into these shapes before decision logic runs.

/** @typedef {'recruit'|'retain'|'reengage'|'develop'|'recover'} AgentDecisionType */
/** @typedef {'up'|'down'|'neutral'|'unknown'} SignalDirection */

/**
 * @typedef {Object} SourceIdentity
 * @property {string} provider
 * @property {string} externalId
 */

/**
 * @typedef {Object} AgentSignal
 * @property {string} id
 * @property {string} tenantId
 * @property {string} agentId
 * @property {string} signalType
 * @property {string} sourceProvider
 * @property {string} sourceRecordId
 * @property {string} observedAt
 * @property {string} ingestedAt
 * @property {unknown} evidence
 * @property {number} confidence
 * @property {SignalDirection} direction
 */

/**
 * @typedef {Object} AgentProfile
 * @property {string} id
 * @property {string} tenantId
 * @property {string} displayName
 * @property {string} lifecycleStage
 * @property {string|null} currentBrokerage
 * @property {Object} geography
 * @property {Object} productionSummary
 * @property {Array<Object>} relationships
 * @property {Array<SourceIdentity>} sourceIdentities
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} AgentDecisionObject
 * @property {string} id
 * @property {string} tenantId
 * @property {string} agentId
 * @property {string} title
 * @property {string} summary
 * @property {string} status
 * @property {Array<string>} signalIds
 * @property {Array<string>} sourceSystemIds
 * @property {AgentDecisionType} decisionType
 * @property {boolean} decisionRequired
 * @property {string|null} decisionDeadline
 * @property {string} urgency
 * @property {Object} authority
 * @property {Object} owner
 * @property {string} recommendedAction
 * @property {Array<string>} rationale
 * @property {Object} valueContext
 * @property {Object} sla
 * @property {Object} verification
 * @property {Object|null} outcome
 * @property {Object} memory
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export const AGENT_SIGNAL_TYPES = Object.freeze({
  PRODUCTION_VOLUME_CHANGE: 'production.volume_change',
  PRODUCTION_TRANSACTION_CHANGE: 'production.transaction_change',
  PRODUCTION_LISTING_CHANGE: 'production.listing_change',
  MARKET_OFFICE_CHANGE: 'market.office_change',
  MARKET_SHARE_CHANGE: 'market.market_share_change',
  RELATIONSHIP_LAST_CONTACT: 'relationship.last_meaningful_contact',
  RELATIONSHIP_ENGAGEMENT_CHANGE: 'relationship.engagement_change',
  RECRUITING_STAGE_CHANGE: 'recruiting.stage_change',
  RECRUITING_STALLED: 'recruiting.stalled',
  RETENTION_SERVICE_ISSUE: 'retention.service_issue',
  RETENTION_COACHING_CHANGE: 'retention.coaching_change',
  REENGAGEMENT_PRIOR_OBJECTION: 'reengagement.prior_objection',
  REENGAGEMENT_CONDITION_CHANGED: 'reengagement.condition_changed',
  GEOGRAPHY_RADIUS_MATCH: 'geography.radius_match',
  CAMPAIGN_ENGAGEMENT: 'campaign.engagement',
  OPEN_HOUSE_ENGAGEMENT: 'event.open_house_engagement'
});

export const AGENT_DECISION_TYPES = Object.freeze([
  'recruit',
  'retain',
  'reengage',
  'develop',
  'recover'
]);

export function assertAgentSignal(signal) {
  const required = [
    'id', 'tenantId', 'agentId', 'signalType', 'sourceProvider',
    'sourceRecordId', 'observedAt', 'ingestedAt', 'confidence', 'direction'
  ];
  const missing = required.filter((key) => signal?.[key] === undefined || signal?.[key] === null);
  if (missing.length) throw new Error(`Invalid AgentSignal; missing: ${missing.join(', ')}`);
  if (signal.confidence < 0 || signal.confidence > 1) {
    throw new Error('Invalid AgentSignal; confidence must be between 0 and 1');
  }
  return signal;
}

export function createAgentDecisionObject(input) {
  if (!AGENT_DECISION_TYPES.includes(input.decisionType)) {
    throw new Error(`Unsupported agent decision type: ${input.decisionType}`);
  }
  if (!input.owner?.id && !input.owner?.role) {
    throw new Error('AgentDecisionObject requires an accountable owner id or role');
  }
  if (!Array.isArray(input.signalIds) || input.signalIds.length === 0) {
    throw new Error('AgentDecisionObject requires evidence signalIds');
  }

  const now = new Date().toISOString();
  return {
    id: input.id,
    tenantId: input.tenantId,
    agentId: input.agentId,
    title: input.title,
    summary: input.summary,
    status: input.status ?? 'proposed',
    signalIds: input.signalIds,
    sourceSystemIds: input.sourceSystemIds ?? [],
    decisionType: input.decisionType,
    decisionRequired: input.decisionRequired ?? true,
    decisionDeadline: input.decisionDeadline ?? null,
    urgency: input.urgency ?? 'normal',
    authority: input.authority ?? { approvalRequired: true },
    owner: input.owner,
    recommendedAction: input.recommendedAction,
    rationale: input.rationale ?? [],
    valueContext: input.valueContext ?? {},
    sla: input.sla ?? {},
    verification: input.verification ?? { required: true, status: 'pending' },
    outcome: input.outcome ?? null,
    memory: input.memory ?? {},
    createdAt: input.createdAt ?? now,
    updatedAt: now
  };
}
