module.exports = {
  device:null,
  node:null,
  init:function(device, node){
    return this;
  },
  registerCapability:function(device){
    //累计使用电量
    //device.registerCapability('measure_power', 'METER');
    device.registerCapability('meter_power', 'METER');
    return this;
  },

  startReport:function(device){
    device.registerReportListener( 'METER', 'METER_REPORT',
      (payload) => {
        console.log('-==-=-=-=-=-=-=-=-=-=- METER_REPORT:', payload);
        const Properties1 = payload['Properties1'] || {};
        const size = Properties1['Size'];//4
        const precision = Properties1['Precision'];//2

        // let meterValue = Buffer.from([0x00, 0x0f, 0x12, 0x05]);
        // console.log('meter value =====>',meterValue);
        // payload['Meter Value'] = meterValue;

        const meterValue2 = payload['Meter Value'];
 
        if (Buffer.isBuffer(meterValue2)) {
          payload['Meter Value (Parsed)'] = meterValue2.readIntBE(0, size);
          payload['Meter Value (Parsed)'] /= 10 ** precision;
        }

        //console.log('METER_REPORT', payload);
        if (Properties1['Scale'] === 0) {
          console.log('show meter value1:', payload['Meter Value (Parsed)']);
            device.setCapabilityValue('meter_power', payload['Meter Value (Parsed)']);
        } else { 
            console.log('show meter value2:', payload['Meter Value (Parsed)']);
            device.setCapabilityValue('meter_power', payload['Meter Value (Parsed)']);
        }
      }
    ); 
    return this;  
  },
}  
 