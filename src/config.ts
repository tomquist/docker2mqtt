import { config as configDotenv } from "dotenv";

function stringEnvVar(envVarName: keyof typeof process["env"]): string;

function stringEnvVar(
  envVarName: keyof typeof process["env"],
  defaultValue: string
): string;

function stringEnvVar(
  envVarName: keyof typeof process["env"],
  defaultValue: null
): string | undefined;
function stringEnvVar(
  envVarName: keyof typeof process["env"],
  defaultValue?: string | null,
): string | undefined {
  const value = process.env[envVarName];
  if (value == null && defaultValue === undefined) {
    console.error(`Missing env var ${envVarName}`);
    process.exit(1);
  }
  return value ?? defaultValue ?? undefined;
}
function intEnvVar(
  envVarName: keyof typeof process["env"],
  defaultValue?: number,
): number {
  if (defaultValue != null) {
    const value = stringEnvVar(envVarName, null);
    if (value == null) {
      return defaultValue;
    }
    return parseInt(value, 10);
  } else {
    const value = stringEnvVar(envVarName);
    return parseInt(value, 10);
  }
}
function boolEnvVar(
  envVarName: keyof typeof process["env"],
  defaultValue = false,
): boolean {
  const value = stringEnvVar(envVarName, null);
  if (value == null) {
    return defaultValue;
  }
  return value === "true";
}

function arrayEnvVar(
  envVarName: keyof typeof process["env"],
  defaultValue?: string[],
): string[] {
  if (defaultValue != null) {
    const value = stringEnvVar(envVarName, null);
    if (value == null) {
      return defaultValue;
    }
    return value.split(",");
  } else {
    const value = stringEnvVar(envVarName);
    return value.split(",");
  }
}
export function getConfig() {
  configDotenv();
  return {
    pollInterval: intEnvVar("D2M_POLL_INTERVAL", 60),
    mqttUrl: stringEnvVar("D2M_MQTT_URI"),
    mqttClientId: stringEnvVar("D2M_MQTT_CLIENT_ID", "docker2mqtt"),
    mqttUsername: stringEnvVar("D2M_MQTT_USERNAME", null),
    mqttPassword: stringEnvVar("D2M_MQTT_PASSWORD", null),
    mqttRetain: boolEnvVar("D2M_MQTT_RETAIN"),
    mqttTopic: stringEnvVar("D2M_MQTT_TOPIC", "docker2mqtt"),
    verbose: boolEnvVar("D2M_VERBOSE", false),
    subscribe: boolEnvVar("D2M_SUBSCRIBE", true),
    poll: boolEnvVar("D2M_POLL", true),
    isSwarmManager: boolEnvVar("D2M_IS_SWARM_MANAGER", false),
  };
}

export function anonymizeConfig(
  config: ReturnType<typeof getConfig>,
): ReturnType<typeof getConfig> {
  const newConfig = { ...config };
  const hideKeys: Array<keyof ReturnType<typeof getConfig>> = [
    "mqttPassword",
  ];
  for (const key of hideKeys) {
    if (config[key] != null) {
      (newConfig as any)[key] = "***";
    }
  }
  return newConfig;
}

export const config = getConfig();
