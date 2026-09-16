export function publicHealthPayload() {
  return {
    status: 'ok',
    service: 'essential-ea-commercial-api'
  };
}

export function publicHealthHandler(req, res) {
  res.status(200).json(publicHealthPayload());
}
