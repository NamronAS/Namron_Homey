const {
    returnCapabilityValue,
    setConfiguratrion
}                               = require('./utils');

module.exports = {
    device:null,
    node:null,
    pu:19,
    capability: 'window_door_alarm',
    init:function(device, node){ 
      device.appkits['pu'+this.pu] = this;
      this.registerCapability(device);
      return this;
    },
    registerCapability:function(device){ 
        device.registerCapabilityListener(this.capability,
            async (payload) => {  
                if (payload === true){  
                    //setConfiguratrion(device, null, this.pu, 1, false, 1);
                }
                else{ 
                    //setConfiguratrion(device, null, this.pu, 1, false, 0);  
                }  
            }
        );
      return this;
    },
    startReport:function(){
      return this;
    },
    update:function(device, payload, config){ 
      if (!device.hasCapability('alarm_generic')) return;
      console.log(this.capability, payload);
      if (config == 1){
        device.setCapabilityValue('alarm_generic', true); 
      }
      else {
        device.setCapabilityValue('alarm_generic', false);
      } 
      return this; 
    }
} 