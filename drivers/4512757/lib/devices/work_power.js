module.exports = {
  device:null,
  node:null,
  pu: 22,
  capability:'measure_power',
  init:function(device, node){
    device.appkits['pu'+this.pu] = this;
    this.registerCapability(device);
    return this;
  },
  registerCapability:function(device){
    //累计使用电量
    device.registerCapability('measure_power', 'METER'); 
    return this;
  },

  startReport:function(device){ 
    return this;  
  },

  update:function(device, payload, config){ 
    console.log('measure_power', payload); 
    const pu = payload['Parameter Number'];
    if (pu == 22){
      const level = payload['Level'] || {};
      const size = level['Size'];//4 
      const value = payload['Configuration Value'];
      const valueInt = value.readIntBE(0, size);  
      device.setCapabilityValue('measure_power', valueInt / 10); 
    }
    
    return this; 
  }
}  
 