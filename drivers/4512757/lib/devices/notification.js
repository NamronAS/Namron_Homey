const {
    returnCapabilityValue, 
    updateTempCapOptions 
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
    this.device.registerReportListener('NOTIFICATION', 'NOTIFICATION_REPORT', 
      (payload) => {
        //console.log('#################################################NOTIFICATION_REPORT', payload); 
        const status = payload['Notification Status']; 
        const type = payload['Notification Type'];
        const event = payload['Event'];
        /*
        {
  'V1 Alarm Type (Raw)': <Buffer 00>,
  'V1 Alarm Type': 0,
  'V1 Alarm Level (Raw)': <Buffer 00>,
  'V1 Alarm Level': 0,
  'Notification Status (Raw)': <Buffer ff>,
  'Notification Status': 'On',
  'Notification Type (Raw)': <Buffer 06>,
  'Notification Type': 'Access Control',
  'Event (Raw)': <Buffer 17>,
  Event: 23,
  'Properties1 (Raw)': <Buffer 00>,
  Properties1: { 'Event Parameters Length': 0, Sequence: false },
  'Event (Parsed)': 'Window/Door is closed'
}       */
       
      if (event == 22){
        console.log('REV: window_door_alarm', 22, true);
        if (this.device.hasCapability('window_door_alarm')){
          this.device.setCapabilityValue('window_door_alarm', true);
        } 
        this.device.setCapabilityValue('alarm_generic', true);
        
      } else if (event == 23){
        console.log('REV: window_door_alarm', 23, false, 'Window/Door is closed');
        if (this.device.hasCapability('window_door_alarm')){
          this.device.setCapabilityValue('window_door_alarm', false);
        }
        this.device.setCapabilityValue('alarm_generic', false); 
      }
          

    });
  }
} 
 