const {
    returnCapabilityValue,
    setConfiguratrion,
    updateTempCapOptions
}                               = require('./utils');

module.exports = {
    device:null,
    node:null,
    pu:10,
    capability: 'frost',
    init:function(device, node){ 
      device.appkits['pu'+this.pu] = this;
      this.registerCapability(device);
      return this;
    },
    registerCapability:function(device){ 
        device.registerCapabilityListener(this.capability,
            async (payload) => {   
                if (payload === true){  
                  let tm = device.getCapabilityValue(device.thermostat_mode_name) || '';
                  console.log('Frost .... check thermostat_mode=', tm);
                  if (tm !== 'heat'){
                    device.setCapabilityValue('frost', false);
                    device.showMessage('Frost must run in `heat` mode.');
                    return;
                  }
                  //updateTempCapOptions(device, 5, 10, 1, device.target_temperature_name); 
                  setConfiguratrion(device, null, this.pu, 1, false, 1);
                }
                else{ 
                  //updateTempCapOptions(device, 5, 40, 0.5, device.target_temperature_name); 
                  setConfiguratrion(device, null, this.pu, 1, false, 0);  
                }  

                device.setStoreValue('frost_is_open', payload);
            }
        );
      return this;
    },
    startReport:function(){
      return this;
    },
    update:function(device, payload, config){ 
      if (!device.hasCapability('frost')) return;
      console.log('**************** frost: ', config);
      if (config == 1){
        device.setCapabilityValue('frost', true);
      }
      else {
        device.setCapabilityValue('frost', false);
      } 
      device.setStoreValue('frost_is_open', config); 
    }
} 