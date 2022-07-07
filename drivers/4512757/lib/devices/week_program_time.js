const {
    getCapabilityValue, 
    updateTempCapOptions,
    setConfiguratrion
}                               = require('./utils');
  
module.exports = {
  device:null,
  node:null,
  pu:199,
  capability: 'week_program_time',
  init:function(device, node){
    device.appkits['pu'+this.pu] = this;
    //this.startReport(device);
    return this;
  },
  registerCapability:function(){
      return this;
  },

  startReport:function(device){
    device.registerCapabilityListener(this.capability,
        async (payload) => { 
          let runModeCapValue = device.getCapabilityValue(this.capability);
          console.log('week_program_time SET:', payload, runModeCapValue); 
          setConfiguratrion(device, null, this.pu, 1, false, payload);  
        }
    ); 
    return this;  
  },
  setConfig:function(device, payload){
    console.log('week_program_time SET:', payload); 
    setConfiguratrion(device, null, this.pu, 4, false, payload);  
  },
  update:function(device, payload, config){
    if (!device.hasCapability(this.capability)) return;
    let runModeCapValue = device.getCapabilityValue(this.capability);
    console.log('week_program_time REV:', runModeCapValue, config);
    device.setCapabilityValue(this.capability, config); 
  }
}  