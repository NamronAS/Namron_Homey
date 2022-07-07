const {
    getCapabilityValue, 
    updateTempCapOptions,
    setConfiguratrion
}                               = require('./utils');
  
module.exports = {
  device:null,
  node:null,
  pu:27,
  capability: 'temp_correction',
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
          console.log(this);
          let runModeCapValue = device.getCapabilityValue(this.capability);
          console.log('temp_correction SET:', payload, runModeCapValue);
          
          this.setConfig(device, payload);
        
        }
    ); 
    return this;  
  },
  setConfig:function(device, payload){
    console.log('temp_correction SET:', payload);
    if (payload >= -10 && payload <= 10){
      setConfiguratrion(device, null, this.pu, 1, false, payload);
    }
    else{
      setConfiguratrion(device, null, this.pu, 1, false, 0);
    }
  },
  update:function(device, payload, config){
    if (!device.hasCapability(this.capability)) return;
    let runModeCapValue = device.getCapabilityValue(this.capability);
    console.log('temp_correction REV:', runModeCapValue, config);
    device.setCapabilityValue(this.capability, config); 
  }
}  