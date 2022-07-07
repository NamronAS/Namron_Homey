const {
    returnCapabilityValue,
    setConfiguratrion
}                               = require('./utils');

module.exports = {
    device:null,
    node:null,
    init:function(device, node){
      //this.device = device;
      //this.node = node;  
      device.appkits['pu4'] = this;
      this.registerCapability(device);
      return this;
    },
    registerCapability:function(device){ 
        device.registerCapabilityListener('eco_mode',
            async (payload) => {
                console.log('eco_mode changed ======', payload); 

                if (payload === true){  

                  let tm = device.getCapabilityValue(device.thermostat_mode_name) || '';
                  console.log('eco_mode .... check thermostat_mode=', tm);
                  if (tm !== 'heat'){
                    device.setCapabilityValue('eco_mode', false);
                    device.showMessage('ECO must run in `heat` mode.');
                    return;
                  }

                    setConfiguratrion(device, null, 4, 1, false, 1);
                }
                else{ 
                    setConfiguratrion(device, null, 4, 1, false, 0);  
                }  
            }
        );
      return this;
    },
    startReport:function(){
      return this;
    },
    update:function(device, payload, config){ 
      if (!device.hasCapability('eco_mode')) return;
            if (config == 1){
              device.setCapabilityValue('eco_mode', true);
            }
            else {
              device.setCapabilityValue('eco_mode', false);
            } 
            return this;
        
    }
} 