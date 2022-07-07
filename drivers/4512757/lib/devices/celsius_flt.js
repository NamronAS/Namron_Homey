const {
    getCapabilityValue, 
    updateTempCapOptions,
    setConfiguratrion
}                               = require('./utils');
  
module.exports = {
  device:null,
  node:null,
  pu:185,
  capability: 'celsius_flt',
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
          console.log('celsius_flt SET:', payload, runModeCapValue); 
          setConfiguratrion(device, null, this.pu, 2, false, payload * 10);  
        }
    ); 
    return this;  
  },
  setConfig:function(device, payload){
    console.log('celsius_flt SET:', payload); 
    setConfiguratrion(device, null, this.pu, 2, false, payload * 10);  
  },
  update:function(device, payload, config){
    if (!device.hasCapability(this.capability)) return;
    let runModeCapValue = device.getCapabilityValue(this.capability);
    console.log('celsius_flt REV:', runModeCapValue, config);
    device.setCapabilityValue(this.capability, config); 
  }
}  