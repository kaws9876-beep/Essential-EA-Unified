# EA STORM Agent Intelligence — Foundation

## Product boundary

EA STORM sits **above and across** brokerage systems as the decision, execution, verification, outcome, and memory layer. It does not replace BrokerMetrics, KW Command, MLS, Google Workspace, the brokerage website, or campaign channels.

Provider flow:

```
BrokerMetrics / MLS / KW Command / Google Workspace / Website / Campaign channels
                              |
                              v
                  Provider-neutral signal adapters
                              |
                              v
                       Agent Identity Graph
                              |
                              v
                    Agent Intelligence Engine
                              |
          Recruit | Retain | Reengage | Develop
                              |
                              v
                       Decision Objects
                              |
                 owner -> action -> due date
                              |
                              v
                 verification -> outcome -> memory
```

External systems provide evidence and signals. STORM owns prioritization, accountable action, verification, measured outcome, and organizational memory.

## Legacy pilot assumptions (discovery inputs, not hard-coded product limits)

- Initial users: 5
- Brokerage family: approximately 300 agents
- Primary use cases: recruiting, retention, reengagement
- Geography: Bexar County; initial office-radius hypothesis 5–15 miles
- Existing systems: BrokerMetrics, KW Command, Google Workspace, MLS
- Command adoption is currently limited
- Existing website may support campaign landing pages
- Potential channels: website, open-house callouts, Facebook, Instagram, LinkedIn
- Desired segmentation includes production volume up/down
- Military-spouse / PCS inbound opportunity is a discovery hypothesis, subject to lawful data sourcing, consent, and fair-housing/employment review
- POC supplied for discovery: John Totin

## Non-negotiable design principles

1. BrokerMetrics is an intelligence provider, not a dependency.
2. KW Command is a system of record/workflow candidate, not something STORM silently replaces.
3. Never infer that an agent will leave. Surface evidence-based relationship attention and explain why.
4. Every recommendation must retain provenance: source, observed time, ingestion time, and evidence reference.
5. Separate observed facts from derived signals and recommendations.
6. Human approval gates precede external outreach until explicitly configured otherwise.
7. Store outcomes so the system learns which interventions work without rewriting historical evidence.
8. Use configurable geography, thresholds, production bands, and campaign rules; do not hard-code Legacy-specific logic into the core.
9. Do not use protected characteristics or proxies for recruiting/retention scoring. Military/PCS campaigns require explicit approved data sources and policy review.

## Core lifecycle

```
DISCOVER -> RECRUIT -> CONVERT -> ONBOARD -> DEVELOP -> RETAIN -> RECOVER -> REENGAGE
                                                                        |
                                                                        v
                                                                      MEMORY
```

## Canonical objects

### AgentProfile

A stable brokerage-side identity independent of any provider-specific ID.

Required:
- id
- tenant_id
- display_name
- lifecycle_stage
- current_brokerage
- geography
- production_summary
- relationships[]
- source_identities[]
- created_at
- updated_at

### AgentSignal

Immutable evidence-derived observation.

Required:
- id
- tenant_id
- agent_id
- signal_type
- source_provider
- source_record_id
- observed_at
- ingested_at
- evidence
- confidence
- direction (up/down/neutral/unknown)

Initial signal vocabulary:
- production.volume_change
- production.transaction_change
- production.listing_change
- market.office_change
- market.market_share_change
- relationship.last_meaningful_contact
- relationship.engagement_change
- recruiting.stage_change
- recruiting.stalled
- retention.service_issue
- retention.coaching_change
- reengagement.prior_objection
- reengagement.condition_changed
- geography.radius_match
- campaign.engagement
- event.open_house_engagement

### AgentDecisionObject

Extension of the existing STORM Decision Object for agent intelligence.

Required:
- id
- tenant_id
- agent_id
- title
- summary
- status
- signal_ids[]
- source_system_ids[]
- decision_type (recruit/retain/reengage/develop/recover)
- decision_required
- decision_deadline
- urgency
- authority
- owner
- recommended_action
- rationale[]
- value_context
- sla
- verification
- outcome
- memory
- created_at
- updated_at

### RelationshipMemory

Preserves why the relationship changed over time:
- interaction
- promise
- objection
- reason_joined
- reason_stayed
- reason_left
- intervention
- outcome
- owner_at_time
- evidence_ref
- occurred_at

## First command-center question

**Who needs our attention today — and why?**

Initial queues:
- Recruit
- Retain
- Reengage
- Develop

Each item must show:
- person
- evidence-backed reason
- material change
- accountable owner
- recommended next move
- deadline
- value context
- provenance

## Integration contracts

All providers normalize into the canonical model. No provider fields may leak into decision-engine logic.

```ts
interface AgentIntelligenceProvider {
  provider: string;
  capabilities(): Promise<ProviderCapabilities>;
  syncAgents(cursor?: string): Promise<AgentIdentityBatch>;
  syncSignals(cursor?: string): Promise<AgentSignalBatch>;
  health(): Promise<ProviderHealth>;
}
```

Initial adapters:
- BrokerMetricsAdapter
- KwCommandAdapter
- GoogleWorkspaceAdapter
- MlsAdapter
- WebsiteCampaignAdapter

Social channels are campaign destinations/signal sources only after API, permission, consent, and policy validation.

## Discovery gates before production integration

### BrokerMetrics
- Which BrokerMetrics product/tier is licensed?
- Is Talent enabled?
- API availability and contractual permission for server-to-server use?
- API docs, authentication method, rate limits, refresh cadence?
- Exact fields available: agent identity, office, brokerage, sides, units, volume, GCI if any, listings, geography, movement?
- Historical depth?
- Stable agent identifier?
- Export/webhook support?
- Which MLS feeds are represented and what are their redistribution/storage restrictions?

### KW Command / CommandMC
- Exact edition and permissions?
- API/partner access available to this Market Center?
- Which records are authoritative: recruits, contacts, activities, SmartPlans, appointments, stages?
- Can STORM write tasks/notes/stage changes, or read only?
- What fields are actually maintained today despite low adoption?
- What data should remain in Command versus STORM?

### Google Workspace
- Which five users/roles?
- Gmail, Calendar, Drive, Sheets, Contacts: which are in scope?
- Shared inboxes/calendars?
- Domain admin available for OAuth approval?
- Retention and access policy?
- Should email/calendar evidence be metadata-only by default, or can content be analyzed?

### Current agent roster / economics
- Authoritative roster source for ~300 agents?
- Join date, team, status, cap/commission model, office, coach/TL?
- Gross revenue definition: brokerage GCI, company dollar, royalty, fees, or agent volume?
- What economic measure should define value protected/created?
- 12/24/36-month historical roster and departure data available?
- Known reasons for departures and prior recruiting losses?

### Recruiting
- What is an ideal recruit?
- Production bands and minimum tenure?
- Geographic rules: office radius, ZIPs, Bexar County, adjacent counties?
- Who owns which recruit?
- Current recruiting stages and SLAs?
- What makes a recruit high priority besides volume?
- What outreach is prohibited?
- What constitutes a successful recruit: appointment, signed, onboarded, productive at 90/180/365 days?

### Retention
- What observable events should trigger relationship attention?
- What is normal production seasonality?
- What is a meaningful volume decline and over what comparison period?
- Which service/coaching/leadership interactions are available?
- Who owns intervention by agent/team?
- What is a successful retention intervention and how is it verified?

### Reengagement
- Do historical former-agent and lost-recruit records exist?
- Is reason-left / reason-lost captured?
- Who historically owned each relationship?
- What changed condition should reopen a relationship?
- How long before a lost recruit becomes eligible for reengagement?
- Suppression/do-not-contact rules?

### Campaigns and outreach
- Existing website/CMS and landing-page ownership?
- Current email/SMS platform?
- Facebook/Instagram/LinkedIn business accounts and approved APIs?
- Human approval required before publishing/sending?
- Brand/compliance approval owner?
- Open-house callout workflow and data source?
- Campaign attribution: impression -> response -> appointment -> join -> production?

### Geography
- Exact office addresses to model configurable radius?
- Is 5, 10, or 15 miles meaningful, or should drive time / ZIP / MLS area be used?
- Should geography rank home address, office affiliation, listing activity, transaction activity, or all four?
- Are there franchise/territory restrictions?

### Military / PCS hypothesis
Do not build a model that guesses military affiliation or PCS status. Discovery must establish lawful, consented/authorized sources.

Ask:
- What approved source would establish inbound relocation/PCS opportunity?
- Are only self-identified military spouses/service members eligible for this campaign?
- Is this agent recruiting, consumer relocation marketing, or both? Keep these datasets and purposes separate.
- What permissions, KW policy, MLS rules, platform advertising rules, and applicable law govern the campaign?
- Which San Antonio installations/areas are legitimately in scope?
- What is the approved value proposition for a relocating real-estate professional?

## MVP acceptance criteria

The first usable pilot should:
1. ingest a synthetic BrokerMetrics-style feed through an adapter;
2. ingest a synthetic Command-style relationship feed;
3. resolve records into one AgentProfile;
4. produce explainable recruit/retain/reengage signals;
5. create an AgentDecisionObject with owner, rationale, deadline, and recommended action;
6. require human approval for outreach;
7. record execution and verification;
8. record outcome and append relationship memory;
9. expose provider provenance on every surfaced recommendation;
10. support configurable Bexar County/radius and volume up/down rules.

No live BrokerMetrics, Command, MLS, Google, social, or PCS data should be connected until the corresponding discovery gate is answered and access is authorized.
