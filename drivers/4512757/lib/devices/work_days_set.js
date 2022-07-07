const {
    getCapabilityValue, 
    updateTempCapOptions,
    setConfiguratrion
}                               = require('./utils');
  
module.exports = {
  device:null,
  node:null,
  pu:31,
  capability: 'work_days_set',
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
          console.log('work days SET:', payload);
            if (payload === "5_2"){   
              setConfiguratrion(device, null, this.pu, 1, false, 0);
            } else if (payload === "6_1"){ 
              setConfiguratrion(device, null, this.pu, 1, false, 1);  
            } else if (payload === "7_0"){
              setConfiguratrion(device, null, this.pu, 1, false, 2);
            } else if (payload === "0_7"){
              setConfiguratrion(device, null, this.pu, 1, false, 3);
            } 
            else{
              setConfiguratrion(device, null, this.pu, 1, false, -1);
            }
        }
    ); 
    return this;  
  },
  update:function(device, payload, config){
    if (!device.hasCapability(this.capability)) return;
    let runModeCapValue = device.getCapabilityValue(this.capability);
    console.log('work days REV:', runModeCapValue);
    switch (config) {
      case 0:
        device.setCapabilityValue(this.capability, '5_2'); 
        break;

      case 1:
        device.setCapabilityValue(this.capability, '6_1'); 
        break;

      case 2:
        device.setCapabilityValue(this.capability, '7_0'); 
        break;
      case 3:
        device.setCapabilityValue(this.capability, "0_7");
        break;

      default:
        device.setCapabilityValue(this.capability, "");
        break;
    }  
  }
}  