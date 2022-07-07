const {
    returnCapabilityValue,
    setConfiguratrion
}                               = require('./utils');

module.exports = {
    device:null,
    node:null,
    pu:188,
    capability: 'lcd_display_switch',
    init:function(device, node){ 
      device.appkits['pu'+this.pu] = this;
      this.registerCapability(device);
      return this;
    },
    registerCapability:function(device){ 
        device.registerCapabilityListener(this.capability,
            async (payload) => {  
                if (payload === true){  
                    setConfiguratrion(device, null, this.pu, 1, false, 1);
                }
                else{ 
                    setConfiguratrion(device, null, this.pu, 1, false, 0);  
                }  
            }
        );
      return this;
    },
    startReport:function(){
      return this;
    },
    setConfig:function(device, payload){
      console.log('lcd_display_switch SET:', payload); 
      setConfiguratrion(device, null, this.pu, 1, false, payload);
    },
    update:function(device, payload, config){ 
      if (!device.hasCapability(this.capability)) return;
      console.log(this.capability, config);
      if (config == 1){
        device.setCapabilityValue(this.capability, true);
      }
      else {
        device.setCapabilityValue(this.capability, false);
      } 
      return this; 
    }
} 