const {
    returnCapabilityValue,
    setConfiguratrion
}                               = require('./utils');

module.exports = {
    device:null,
    node:null,
    pu:8,
    capability: 'window_check',
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
    setConfig: function(device, payload){
      console.log('window check SET:', payload);
      if (payload){
        setConfiguratrion(device, null, this.pu, 1, false, 1); 
      }
      else{
        setConfiguratrion(device, null, this.pu, 1, false, 0); 
      }
      
    },
    update:function(device, payload, config){ 
      
      //console.log(this.capability, config); 
      if (config == 1){
        device.setSettings({ 
          window_check: true,
        }); 
        if (device.hasCapability(this.capability)){
          device.setCapabilityValue(this.capability, true);
        }
      }
      else {
        device.setSettings({ 
          window_check: false,
        }); 
        if (device.hasCapability(this.capability)){
          device.setCapabilityValue(this.capability, false);
        }
      } 
      return this; 
    }
} 