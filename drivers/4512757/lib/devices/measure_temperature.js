const {
    getCapabilityValue, 
    updateTempCapOptions 
}                               = require('./utils');
  
module.exports = {
  device:null,
  node:null,
  init:function(device, node){ 
    return this;
  },
  registerCapability:function(device){
    device.registerCapability('measure_temperature', 'SENSOR_MULTILEVEL');
    updateTempCapOptions(device, -10, 60, 0.5, 'measure_temperature');
    return this;
  },

  startReport:function(device){
    device.registerReportListener(
      'SENSOR_MULTILEVEL',
      'SENSOR_MULTILEVEL_REPORT',
      (report) => {
        //console.log('====当前温度 SENSOR_MULTILEVEL_REPORT=====', report); 
        device.current_measure_temperature = report['Sensor Value (Parsed)'];
        device.homey.settings.set('current_measure_temperature', device.current_measure_temperature);
        //console.log('当前温度： ', device.current_measure_temperature);
      }
    );
    return this;  
  },
}  