const {
    getCapabilityValue, 
    updateTempCapOptions,
    setConfiguratrion
}                               = require('./utils');
  
module.exports = {
  device:null,
  node:null,
  pu:134,
  capability: 'dif_celsius',
  init:function(device, node){
    device.appkits['pu'+this.pu] = this;
    this.startReport(device);
    return this;
  },
  registerCapability:function(){
      return this;
  },

  startReport:function(device){
    device.registerCapabilityListener(this.capability,
        async (payload) => { 
          let runModeCapValue = device.getCapabilityValue(this.capability);
          console.log('dif_celsius SET:', payload, runModeCapValue); 
          setConfiguratrion(device, null, this.pu, 1, false, payload);  
        }
    ); 
    return this;  
  },
  setConfig:function(device, config){
    setConfiguratrion(device, null, this.pu, 1, false, config);  
  },
  update:function(device, payload, config){
    if (!device.hasCapability(this.capability)) return;
    let runModeCapValue = device.getCapabilityValue(this.capability);
    console.log('dif_celsius REV:', runModeCapValue, config);
    device.setCapabilityValue(this.capability, config); 
  }
}  