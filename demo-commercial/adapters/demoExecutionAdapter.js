const SIMULATED_STATUS = 'simulated';

function simulatedResult(operation, message, details = {}) {
  return {
    operation,
    status: SIMULATED_STATUS,
    persistedExternally: false,
    message,
    details
  };
}

export function simulateDraftExecutiveResponse(context = {}) {
  return simulatedResult(
    'simulateDraftExecutiveResponse',
    'Simulated draft only. No external system was contacted.',
    { opportunityId: context.opportunityId || null }
  );
}

export function simulateScheduleDecisionCall(context = {}) {
  return simulatedResult(
    'simulateScheduleDecisionCall',
    'Simulated calendar hold only. No external system was contacted.',
    { ownerId: context.ownerId || null }
  );
}

export function simulateUpdateOpportunityStage(context = {}) {
  return simulatedResult(
    'simulateUpdateOpportunityStage',
    'Simulated opportunity update only. No external system was contacted.',
    { stage: context.stage || 'review-required' }
  );
}

export function simulateCreateOperationsTask(context = {}) {
  return simulatedResult(
    'simulateCreateOperationsTask',
    'Simulated operations task only. No external system was contacted.',
    { ownerId: context.ownerId || null }
  );
}

export function runDemoOperation(operationName, context = {}) {
  const operations = {
    simulateDraftExecutiveResponse,
    simulateScheduleDecisionCall,
    simulateUpdateOpportunityStage,
    simulateCreateOperationsTask
  };

  const operation = operations[operationName];
  if (!operation) {
    throw new Error(`Demo execution denied: unknown simulated operation "${operationName}".`);
  }

  return operation(context);
}
