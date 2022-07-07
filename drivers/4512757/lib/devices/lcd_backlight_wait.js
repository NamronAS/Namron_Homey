const {
    getCapabilityValue, 
    updateTempCapOptions,
    setConfiguratrion
}                               = require('./utils');
  
module.exports = {
  device:null,
  node:null,
  pu:123,
  capability: 'lcd_backlight_wait',
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
          let runModeCapValue = device.getCapabilityValue(this.capability);
          console.log('lcd_backlight_wait SET:', payload, runModeCapValue); 
          setConfiguratrion(device, null, this.pu, 4, false, payload);  
        }
    ); 
    return this;  
  },
  setConfig:function(device, payload){
    console.log('lcd_backlight_wait SET(config):', payload);
    setConfiguratrion(device, null, this.pu, 4, false, payload);
  },
  update:function(device, payload, config){  
    console.log('lcd_backlight_wait REV:', payload, config);
    //device.setCapabilityValue(this.capability, config); 
    let strValue = ""+config+"";
    device.setSettings({ 
      lcd_backlight_wait: strValue,
    });
  }
}  