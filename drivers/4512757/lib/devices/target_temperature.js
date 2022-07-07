const {
  returnCapabilityValue, 
  updateTempCapOptions,
  checkThermostatModeByTargetTemp,
  setTargetTemperature,
}                               = require('./utils');

function state2value(state) {
  if (state === 'off') {
    return 0;
  } else if (state === 'heat') {
    return 1;
  } else if (state === 'cool') {
    return 2;
  } else {
    return 3;
  }
}

module.exports = {
  device:null,
  node:null,
  init:function(device, node){
    //this.device = device;
    //this.node = node; 
    return this;
  },

  registerCapability:function(device){
    device.registerCapability(device.target_temperature_name, 'THERMOSTAT_SETPOINT');
    updateTempCapOptions(device, 0, 40, 0.5, device.target_temperature_name); 
    return this;
  },

  startReport:function(device, node){
    
    device.registerCapabilityListener(device.target_temperature_name, async (value) => {
       
      console.log('============================================target_temperature -----changed:', 
          value, 'current:', device.current_measure_temperature); 
      //checkThermostatModeByTargetTemp(this.device, this.node, value);   
      setTargetTemperature(device, node, value); 
    });

    device.registerReportListener('THERMOSTAT_SETPOINT', 'THERMOSTAT_SETPOINT_REPORT',
      async (payload) => {
          //console.log('@@@@@@@@@@@@@@ THERMOSTAT_SETPOINT_REPORT...payload = ',payload);
          const Level2 = payload['Level2'] || {};
          const size = Level2['Size'];//4
          const precision = Level2['Precision'];//1
          const meterValue = payload['Value'];
          if (Buffer.isBuffer(meterValue)) {
              payload['Value (Parsed)'] = meterValue.readIntBE(0, size);
              payload['Value (Parsed)'] /= 10 ** precision;
          }  
      }
    ); 

    return this;
  },
  
} 