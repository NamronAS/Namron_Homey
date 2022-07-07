const {
    getCapabilityValue, 
    updateTempCapOptions,
    setConfiguratrion
}                               = require('./utils');
  
module.exports = {
  device:null,
  node:null,
  pu:136,
  capability: 'frost_celsius',
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
          //不起作用（我界面操作）
          let runModeCapValue = device.getCapabilityValue(this.capability);
          console.log('frost_celsius SET:', payload, runModeCapValue); 
          setConfiguratrion(device, null, this.pu, 4, false, payload);  
        }
    ); 
    return this;  
  },
  setConfig:function(device, payload){
    console.log('frost_celsius SET:', payload); 
    setConfiguratrion(device, null, this.pu, 4, false, payload*10);  
  },
  update:function(device, payload, config){
    console.log('frost_celsius REV:', payload, config);
    /*
    let runModeCapValue = device.getCapabilityValue(this.capability);
    device.setCapabilityValue(this.capability, config); */

    let fc = parseInt(config, 10) / 10;
    device.setSettings({ 
      frost_celsius: fc,
    });
  }
}  