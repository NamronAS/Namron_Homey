const {
    returnCapabilityValue, 
    updateTempCapOptions,
    setTargetTemperature
}                               = require('./utils');
  
module.exports = {
  device:null,
  node:null,
  init:function(device, node){
    //this.device = device;
    //this.node = node;
    return this;
  },

  registerCapability:function(device, node){
    device.registerCapabilityListener(device.thermostat_mode_name,
      async (value) => {
        console.log('d', 'thermostat_mode  changed ======', value);

        let modeStr;
        if ('off' == value){
          modeStr = "Off";
        } else if ('heat' === value) {
          modeStr = "Heat";    
        } else if ('cool' === value) {
          modeStr = "Cool";
        } else if ('eco' === value){
          modeStr = "Eco";
        } else if ('auto' === value) {
          modeStr = "Auto";
        } 

        console.log('d', '...THERMOSTAT_MODE_SET');
        let manuData = Buffer.alloc(2);
        await node.CommandClass.COMMAND_CLASS_THERMOSTAT_MODE.THERMOSTAT_MODE_SET({
          Level: {
            'No of Manufacturer Data fields': 0,
            Mode: modeStr
          },
          'Manufacturer Data':manuData
        });
 
        if ('eco' === value){
          //eco 设置
          //this.setConfig(node, 1, 1, true, 1);
          //this.setConfig(node, 58, 1, false, 1); 
        } 
        device.homey.settings.set(device.thermostat_mode_name, value);
       
    });
    return this;
  },

  startReport:function(device){
    device.registerReportListener('THERMOSTAT_MODE', 'THERMOSTAT_MODE_REPORT',
      (payload) => {

        if (!device.hasCapability(device.thermostat_mode_name)) return;

        console.log('d', '==2===================================THERMOSTAT_MODE_REPORT payload= > ',payload);
        
        const mode = payload['Level (Raw)'];
        // console.log('THERMOSTAT_MODE_REPORT.mode = ', mode);
        if (Buffer.isBuffer(mode)) { 
          const modeInt = mode.readIntBE(0, 1); 
          console.log('d','-------------监测到模式改变', modeInt);    
         
            if (modeInt === 0){
              device.setCapabilityValue(device.thermostat_mode_name, 'off');
            } else if (modeInt === 1) {
              device.setCapabilityValue(device.thermostat_mode_name,'heat');
            } else if (modeInt === 2){
              device.setCapabilityValue(device.thermostat_mode_name,'cool');
            } else if (modeInt === 3){
              device.setCapabilityValue(device.thermostat_mode_name,'auto');
            } else if (modeInt === 4){
              device.setCapabilityValue(device.thermostat_mode_name,'eco');
            }
            
            console.log('d', '....更新当前模式的状态到UI.end');
          //}
        }
 
         
        //let value = device.getCapabilityValue('target_temperature', 'THERMOSTAT_SETPOINT');
        //setTargetTemperature(device, node, value);  
      }
    );
    return this;
  }
}
    