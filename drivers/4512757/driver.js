'use strict';

const { Driver } = require('homey');
const JSTAR_Thermostat = require('./device');

  
class WenkongDriver extends Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('WenkongDriver has been initialized');

    
   
  } 
  
    /*
    if( device.hasCapability('dim') ) {
      return MyDeviceDim;
    } else {
      return MyDevice;
    }*/
  

  async onPair1(session) {
       
  }
 
  async onPairListDevices() {
 
  }
}

module.exports = WenkongDriver;