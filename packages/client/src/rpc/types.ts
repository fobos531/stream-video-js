export type StreamVideoClientOptions = {
  /**
   * The baseURL for the RPC calls
   */
  coordinatorRpcUrl?: string;

  /**
   * The baseURL for the Coordinator WS endpoint.
   */
  coordinatorWsUrl?: string;

  /**
   * The total number of latency measurements to be performed to a
   * certain edge node before joining a call.
   */
  latencyMeasurementRounds?: number;

  /**
   * Auth token.
   */
  token: string | (() => string);
};
