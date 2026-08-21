import pino from "pino";

const nodeEnv = process.env["NODE_ENV"] ?? "development";

// Pretty printing is a development affordance. It runs through pino-pretty, which
// pino loads as a transport on a worker thread, so enable it only in real local
// development. Test runners and every deployed environment take plain JSON.
const usePrettyTransport = nodeEnv === "development";
const logLevel = process.env["LOG_LEVEL"] ?? "info";
const serviceName = process.env["APP_NAME"] ?? "ai-opti-nextjs-starter";

/**
 * Base Pino logger configuration.
 *
 * - JSON output in production for machine parsing
 * - Pretty output in development for readability
 * - Base fields: service, environment
 */
export const logger = pino({
  level: logLevel,
  base: {
    service: serviceName,
    environment: nodeEnv,
  },
  ...(usePrettyTransport
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

export type Logger = typeof logger;
