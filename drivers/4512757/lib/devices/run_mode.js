const {
    getCapabilityValue, 
    updateTempCapOptions,
    setConfiguratrion
}                               = require('./utils');
  
module.exports = {
  device:null,
  node:null,
  init:function(device, node){
    //this.device = device;
    //this.node = node;  
    device.appkits['pu58'] = this;
    this.startReport(device);
    return this;
  },
  registerCapability:function(){
      return this;
  },

  startReport:function(device){
    device.registerCapabilityListener('run_mode',
        async (payload) => {  
            this.setConfig(device, payload);
        }
    ); 
    return this;  
  },
  setConfig:function(device, payload){
    console.log('run_mode SET: ', payload);  
    if (payload === "manual"){   
      setConfiguratrion(device, null, 58, 1, false, 0); 
    } else if (payload === "program"){   
      setConfiguratrion(device, null, 58, 1, false, 1);  
    }  
  },
  update:function(device, payload, config){
    
    //let runModeCapValue = device.getCapabilityValue('run_mode');
    //console.log('run_mode update：', runModeCapValue);
    if (config === 1){
      if (device.hasCapability('run_mode')) { 
        device.setCapabilityValue('run_mode', 'program'); 
      }  
      device.setSettings({ run_mode: 'program' });
    }
    else{
      if (device.hasCapability('run_mode')) {
        device.setCapabilityValue('run_mode', 'manual'); 
      }
      device.setSettings({ run_mode: 'manual' });
    }  
 
    
  }
}  