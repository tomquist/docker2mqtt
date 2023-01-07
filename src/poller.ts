import * as MQTT from "async-mqtt";
import { config } from "./config";
import { logger } from "./logger";

const topicPrefix = config.mqttTopic;

const startTime = new Date().getTime();
function fetchUptime() {
  const currentMillis = new Date().getTime();
  return { topic: "uptime", data: (currentMillis - startTime).toString() };
}

interface PollResult {
  topic: string;
  data: string | Buffer;
}

type Poller = () => Promise<PollResult | PollResult[]> | PollResult | PollResult[];

const pollers: Poller[] = [
  fetchUptime,
];

async function runPoller(client: MQTT.AsyncMqttClient, poller: Poller) {
  logger.log("Running poller", poller.name);
  let results = await poller();
  logger.log("Publishing results of poller", poller.name);
  results = Array.isArray(results) ? results : [results];
  for (const result of results) {
    if (client.disconnected) {
      client.reconnect();
    }
    await client.publish(`${topicPrefix}/${result.topic}`, result.data);
  }
  logger.log("Finished with poller", poller.name);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
    
export async function runPolling(client: MQTT.AsyncMqttClient) {
  for (;;) {
    const start = new Date().getTime();
    await Promise.allSettled(pollers.map(runPoller.bind(undefined, client)));
    const end = new Date().getTime() - start;
    const sleepInterval = config.pollInterval * 1000 - end;
    logger.log(`Sleeping for ${sleepInterval}ms...`);
    if (sleepInterval > 0) {
      await sleep(sleepInterval);
    }
  }
}

