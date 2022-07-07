const { ZigBeeDevice } = require("homey-zigbeedriver");
const { CLUSTER } = require("zigbee-clusters");
const HzcZigBeeLightDevice = require("./HzcZigBeeLightDevice");
  
class d628zg_1402768_device extends HzcZigBeeLightDevice {
  async onNodeInit({ zclNode }) {  

    await super.onNodeInit({ zclNode, supportsHueAndSaturation: false, supportsColorTemperature: true });
 
  }
 
}

module.exports = d628zg_1402768_device;