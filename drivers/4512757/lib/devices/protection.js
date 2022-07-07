const {
    returnCapabilityValue, 
    updateTempCapOptions,
    PuCapability
}                               = require('./utils');
  
module.exports = {
  device:null,
  node:null,
  init:function(device, node){
    this.device = device;
    this.node = node;  
    return this;
  },
  registerCapability:function(){ 
    return this;
  },
  startReport:function(){
    console.log('~~~~~~~~~~~~~~~PROTECTION_REPORT', 'start report ....');
    this.device.registerReportListener('PROTECTION', 'PROTECTION_REPORT', 
      (payload) => { 
        console.log('~~~~~~~~~~~~~~~PROTECTION_REPORT', payload);

        let state = 0;
        const pu = payload['Level']['Local Protection State']; 
        if (Buffer.isBuffer(pu)) { 
          state = pu.readIntBE(0, 1); 
        }
        else {
          state = pu;
        }

        if (state == 0){
          this.device.setCapabilityValue('child_lock', false); 
        }
        else if (state == 1){
          this.device.setCapabilityValue('child_lock', true); 
        } 
    });
    console.log('~~~~~~~~~~~~~~~PROTECTION_REPORT', 'end report ....');

  }
} 
 