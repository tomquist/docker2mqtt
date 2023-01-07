# docker2mqtt

CLI tool to poll the Docker API and publish data to an MQTT broker and perform some docker commands via MQTT.

## Locally
```bash
yarn install && yarn build
  D2M_MQTT_URI=mqtt://rpi1:1883 \
  yarn start
```

## Docker
```bash
docker run -d \
  -e D2M_MQTT_URI=mqtt://rpi1:1883
  tomquist/docker2mqtt:latest
```

## Configuration
The app can be configured using these environment variables:

- `D2M_POLL_INTERVAL` (optional): The polling interval in seconds (Default `60`) 
- `D2M_MQTT_URI` (required): // The MQTT broker URL, e.g. `mqtt://host:1883`
- `D2M_MQTT_USERNAME` (optional): // Optional username for MQTT authentication
- `D2M_MQTT_PASSWORD` (optional): // Optional password for MQTT authentication
- `D2M_MQTT_CLIENT_ID` (optional): // MQTT client identifier. Default: `docker2mqtt`
- `D2M_MQTT_TOPIC` (required): // Topic prefix where data should be published. Default: `docker2mqtt`
- `D2M_VERBOSE` (optional): // Set to `true` for more logs. Default: `false'