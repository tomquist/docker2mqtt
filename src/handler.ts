import * as MQTT from "async-mqtt";
import Dockerode from "dockerode";
import { config } from "./config";
import { logger } from "./logger";

const topicPrefix = config.mqttTopic;

async function restartService(topic: string, message: Buffer) {
  const serviceName = message.toString();
  logger.log("Restarting service", serviceName);
  const docker = new Dockerode();
  const services = await docker.listServices({ filters: { name: [serviceName] } });
  if (services.length > 0) {
    const spec = services[0].Spec;
    const opts = { _query: { version: services[0].Version!.Index }, _body: { ...spec, TaskTemplate: { ...spec?.TaskTemplate, ForceUpdate: (spec?.TaskTemplate?.ForceUpdate ?? 0) + 1 } } };
    await docker.getService(services[0].ID).update(opts);
  } else {
    logger.error("Could not find service ", serviceName);
  }
}

async function ping(topic: string, message: Buffer, client: MQTT.AsyncMqttClient) {
  logger.log(message.toString());
  await client.publish(`${topicPrefix}/pong`, message);
}

interface Handler {
  topic: string | string[];
  handler(topic: string, message: Buffer, client: MQTT.AsyncMqttClient): Promise<void>;
}

const handlers: Handler[] = [
  { topic: "restart-service", handler: restartService },
  { topic: "ping", handler: ping },
];
  
function matchTopic(subscriptionTopic: string, messageTopic: string): boolean {
  const subComp = subscriptionTopic.split("/");
  const topComp = messageTopic.split("/");
  for (let i = 0; i < topComp.length; i++) {
    const currentSubComp = subComp[i];
    if (currentSubComp === "#") {
      return true;
    }
    if (currentSubComp !== "+" && currentSubComp !== topComp[i]) {
      return false;
    }
  }
  return true;
}
  
export async function subscribeToTopics(client: MQTT.AsyncMqttClient) {
  const allTopicSubscriptions = handlers.flatMap(handler => handler.topic).map(t => `${topicPrefix}/${t}`);
  logger.log("Subscribing to topics", allTopicSubscriptions);
  await client.subscribe(allTopicSubscriptions);
  
  client.on("message", (topic, message, a) => {
    logger.log("Received message:", topic);
    for (const handler of handlers) {
      const handlerTopics = Array.isArray(handler.topic) ? handler.topic : [handler.topic];
      if (handlerTopics.some(handlerTopic => matchTopic(`${topicPrefix}/${handlerTopic}`, topic))) {
        logger.error("Handling message on topic", topic, "using handler", handler.handler.name);
        handler.handler(topic.slice(topicPrefix.length + 1), message, client).then(() => {
          logger.log("Finished handling message on topic", topic);
        }).catch((e) => {
          logger.error("Failed handling message on topic", topic, e);
        });
      }
    }
  });
}
  