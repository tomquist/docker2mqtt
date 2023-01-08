import * as MQTT from "async-mqtt";
import { config } from "./config";
import { subscribeToTopics } from "./handler";
import { logger } from "./logger";
import { runPolling } from "./poller";

async function run() {
  const client = await MQTT.connectAsync(config.mqttUrl, {
    clientId: config.mqttClientId,
    username: config.mqttUsername,
    password: config.mqttPassword,
    resubscribe: true,
  });
  client.on("error", (e) => {
    logger.error("MQTT Error:", e);
  });
  if (config.subscribe) {
    await subscribeToTopics(client);
  }
  if (config.poll) {
    await runPolling(client);
  }
}

run().then(() => {
  logger.log("End");
  process.exit(0);
}).catch((e)=> {
  logger.error(e);
  process.exit(1);
});

