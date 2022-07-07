const {
    returnCapabilityValue,
    setConfiguratrion,
    toggleSwitch
}                               = require('./utils');

module.exports = {  
    capability: 'app_reset',
    init:function(device, node){  
      this.registerCapability(device, node);
      return this;
    },
    registerCapability:function(device, node){   

        device.registerCapabilityListener(this.capability,   
            async (payload) => {  
              console.log('app reset: ', payload);

              let mode_changed = device.getStoreValue('regulator_mode_changed') || false;
              if (mode_changed){
                //device.restartApp(node); 
                //device.onInit(node);
                
              }
              else{
                //开关操作
                if (payload){
                  await device.triggerCapabilityListener('onoff', true);
                }
                else{
                  await device.triggerCapabilityListener('onoff', false);
                }
              }  

              device.unsetWarning();

                /*
                if (device.hasCapability('app_reset')){
                  device.removeCapability('app_reset');
                } */
                
            }
        ); 
        return this;
    } 
} 