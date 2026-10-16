export const scenario = Object.freeze({
  organization: 'Northstar Group',
  host: 'Northstar WorkOS',
  record: 'Material Commitment 2048',
  recordType: 'Executive commitment',
  exposure: '$1.8M',
  deadline: '48 hours',
  hostState: {
    status: 'Resolved',
    tasks: '5 / 5 complete',
    sla: 'Met',
    owner: 'Operations Lead',
    lastUpdated: '09:42'
  },
  tasks: [
    ['Executive response sent', 'Complete'],
    ['Finance review recorded', 'Complete'],
    ['Account owner assigned', 'Complete'],
    ['Customer follow-up logged', 'Complete'],
    ['Commitment marked resolved', 'Complete']
  ],
  evidence: [
    {
      id: 'customer',
      source: 'Customer response',
      title: '“This is still not fixed.”',
      detail: 'The customer confirms the commitment remains unresolved after the host workflow closed.',
      state: 'Contradiction'
    },
    {
      id: 'finance',
      source: 'Finance record',
      title: '$1.8M exposure remains open',
      detail: 'The financial condition tied to the commitment has not cleared.',
      state: 'Open'
    },
    {
      id: 'memory',
      source: 'Operating memory',
      title: 'Two related failures in 90 days',
      detail: 'Both prior incidents used the same activity-based closure rule.',
      state: 'Recurring'
    }
  ],
  diagnosis: {
    headline: 'The work closed. The problem did not.',
    cause: 'The host system accepted completed activity as proof of resolution. No single owner was accountable for the outcome, and no independent evidence was required before closure.',
    confidence: '93% correlated confidence'
  },
  plan: {
    current: {
      label: 'Recover now',
      owner: 'Outcome Owner',
      actions: ['Reopen the commitment', 'Resolve the finance condition', 'Confirm the customer outcome']
    },
    prevention: {
      label: 'Prevent recurrence',
      owner: 'Operating Authority',
      actions: ['Replace task-based closure', 'Require independent outcome proof', 'Test the control in the next cycle']
    },
    authority: 'Operating VP approval + Finance Authority concurrence',
    rationale: 'Material exposure exceeds the operator threshold and changes a closure control.'
  },
  execution: [
    ['Recovery opened', 'Outcome Owner assigned'],
    ['Financial condition corrected', 'Evidence returned'],
    ['Customer outcome confirmed', 'Independent reviewer'],
    ['Closure rule changed', 'Authority recorded'],
    ['Next-cycle proof gate active', 'Recurrence test scheduled']
  ],
  outcome: {
    recovered: 'Current commitment independently verified',
    prevented: 'Next-cycle false closure blocked',
    testWindow: '21-day modeled recurrence window',
    memory: 'The new closure rule now requires outcome evidence before “Resolved” is permitted.'
  }
});
