const YAML = require("yaml");

globalThis.YAML_SILENCE_WARNINGS = true;
globalThis.YAML_SILENCE_DEPRECATION_WARNINGS = true;

function configYAMLAdapter(configString) {
  const parsedConfig = YAML.parse(configString);
  if (parsedConfig === null) return {};
  const config = Object.assign({}, parsedConfig.global);
  if (parsedConfig.hosts) config.configVHost = parsedConfig.hosts;
  else delete config.configVHost;
  return config;
}

module.exports = configYAMLAdapter;
