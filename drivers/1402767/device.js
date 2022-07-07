const { ZigBeeDevice } = require("homey-zigbeedriver");
const { CLUSTER } = require("zigbee-clusters");
const HzcZigBeeLightDevice = require("./HzcZigBeeLightDevice");
  
class rbzbDimmerDevice extends HzcZigBeeLightDevice {
  async onNodeInit({ zclNode }) { 

    await super.onNodeInit({ zclNode, supportsHueAndSaturation: false, supportsColorTemperature: true });
     
  }
 
}

module.exports = rbzbDimmerDevice;